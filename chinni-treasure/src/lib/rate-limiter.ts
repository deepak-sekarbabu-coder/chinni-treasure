import { NextResponse } from "next/server";
import { redis } from "@/src/lib/redis";

const WINDOW_SECONDS = 60;
const CLEANUP_INTERVAL = 300_000;

/**
 * Named rate-limit policies — one per guarded surface, carrying its ceiling and
 * the refusal copy. The route guard applies a policy by name, so no route
 * composes a key (`order:${ip}`) or words its own 429 twice.
 */
export const RATE_LIMIT_POLICIES = {
  login: { max: 5, message: "Too many attempts. Try again later." },
  order: { max: 3, message: "Too many order attempts. Please try again later." },
  razorpay: { max: 5, message: "Too many payment attempts. Please try again later." },
  verify: { max: 5, message: "Too many verification attempts. Please try again later." },
  track: { max: 10, message: "Too many tracking requests. Please try again later." },
} as const;

export type RateLimitPolicy = keyof typeof RATE_LIMIT_POLICIES;

function createMemoryLimiter() {
  const store = new Map<string, { count: number; resetAt: number }>();
  let lastCleanup = Date.now();

  function evictExpired() {
    if (Date.now() - lastCleanup < CLEANUP_INTERVAL) return;
    lastCleanup = Date.now();
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetAt) store.delete(key);
    }
  }

  return (key: string, maxAttempts: number): boolean => {
    evictExpired();
    const now = Date.now();
    let entry = store.get(key);

    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + WINDOW_SECONDS * 1000 };
      store.set(key, entry);
    }

    entry.count++;
    return entry.count <= maxAttempts;
  };
}

const memoryLimiter = createMemoryLimiter();

/** Best-effort client IP from standard proxy headers; "unknown" when absent. */
function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/** Redis when configured, in-memory fallback otherwise — one count per attempt. */
async function countAttempt(key: string, maxAttempts: number): Promise<boolean> {
  if (!redis) return memoryLimiter(key, maxAttempts);

  try {
    const cacheKey = `ratelimit:${key}`;
    const results = await redis.multi().incr(cacheKey).expire(cacheKey, WINDOW_SECONDS).exec();
    const count = results?.[0]?.[1];
    if (typeof count !== "number") return memoryLimiter(key, maxAttempts);

    return count <= maxAttempts;
  } catch {
    return memoryLimiter(key, maxAttempts);
  }
}

/**
 * Apply a named policy to a request. Returns the 429 refusal to short-circuit
 * the route, or `null` to carry on — the same "return a response or null"
 * shape `validateCsrfOrigin` uses, so the guard reads as a list of refusals.
 */
export async function guardRateLimit(
  policy: RateLimitPolicy,
  request: Request,
): Promise<NextResponse | null> {
  const { max, message } = RATE_LIMIT_POLICIES[policy];
  const allowed = await countAttempt(`${policy}:${getClientIp(request)}`, max);
  if (allowed) return null;

  return NextResponse.json(
    { error: message },
    { status: 429, headers: { "Retry-After": "60" } },
  );
}
