import { NextResponse } from "next/server";
import { redis } from "@/src/lib/redis";

export const PING_TIMEOUT_MS = 2_000;

// GET /api/health/redis — Lightweight Redis connectivity check.
// Redis is optional: without REDIS_URL the app falls back to in-memory
// stores, so "not_configured" is reported as a healthy 200, not an error.
export async function GET() {
  if (!redis) {
    return NextResponse.json({ status: "ok", redis: "not_configured" });
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const pong = await Promise.race([
      // Swallow a late rejection so it can't become an unhandled rejection if
      // the race already settled via the timeout below.
      redis.ping().catch(() => "unreachable" as const),
      new Promise<"timeout">((resolve) => {
        timer = setTimeout(() => resolve("timeout"), PING_TIMEOUT_MS);
      }),
    ]);
    if (timer) clearTimeout(timer);

    if (pong !== "PONG") {
      return NextResponse.json({ status: "error", redis: "unreachable" }, { status: 503 });
    }
    return NextResponse.json({ status: "ok", redis: "connected" });
  } catch {
    if (timer) clearTimeout(timer);
    return NextResponse.json({ status: "error", redis: "unreachable" }, { status: 503 });
  }
}
