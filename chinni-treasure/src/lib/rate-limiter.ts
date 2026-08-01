import { redis } from "@/src/lib/redis";

const WINDOW_SECONDS = 60;
const MAX_ATTEMPTS = 5;
const CLEANUP_INTERVAL = 300_000;

type RateLimitResult = { allowed: boolean; remaining: number };

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

  return (key: string, maxAttempts = MAX_ATTEMPTS): RateLimitResult => {
    evictExpired();
    const now = Date.now();
    let entry = store.get(key);

    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + WINDOW_SECONDS * 1000 };
      store.set(key, entry);
    }

    entry.count++;
    const remaining = Math.max(0, maxAttempts - entry.count);
    return { allowed: entry.count <= maxAttempts, remaining };
  };
}

const memoryLimiter = createMemoryLimiter();

/**
 * Best-effort client IP extraction using standard proxy headers.
 * Falls back to "unknown" when no header is present.
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function checkRateLimit(
  key: string,
  maxAttempts = MAX_ATTEMPTS,
): Promise<RateLimitResult> {
  if (!redis) return memoryLimiter(key, maxAttempts);

  try {
    const cacheKey = `ratelimit:${key}`;
    const results = await redis.multi().incr(cacheKey).expire(cacheKey, WINDOW_SECONDS).exec();
    const count = results?.[0]?.[1];
    if (typeof count !== "number") return memoryLimiter(key, maxAttempts);

    const remaining = Math.max(0, maxAttempts - count);
    return { allowed: count <= maxAttempts, remaining };
  } catch {
    return memoryLimiter(key, maxAttempts);
  }
}
