import { vi, describe, it, expect, beforeEach } from "vitest";
import { createMockRedis } from "@/src/__tests__/mocks/redis";

// Override the global setup mock with a fake Redis client to exercise the
// configured path (REDIS_URL set). The factory creates the instance itself so
// the mock is hoisting-safe; the same cached instance is imported back below.
vi.mock("@/src/lib/redis", () => ({ redis: createMockRedis() }));

import { redis } from "@/src/lib/redis";
import { GET, PING_TIMEOUT_MS } from "@/app/api/health/redis/route";

const mockRedis = redis as unknown as ReturnType<typeof createMockRedis>;

describe("GET /api/health/redis (configured)", () => {
  beforeEach(() => {
    mockRedis.reset();
    vi.clearAllMocks();
  });

  it("returns ok/connected with 200 when Redis responds to PING", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok", redis: "connected" });
  });

  it("returns 503 with unreachable when PING fails", async () => {
    mockRedis.setFail("ping", true);
    const res = await GET();
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ status: "error", redis: "unreachable" });
  });

  it("returns 503 with unreachable when PING times out", async () => {
    mockRedis.setPingHang(true);
    vi.useFakeTimers();
    try {
      const resPromise = GET();
      await vi.advanceTimersByTimeAsync(PING_TIMEOUT_MS);
      const res = await resPromise;
      expect(res.status).toBe(503);
      expect(await res.json()).toEqual({ status: "error", redis: "unreachable" });
    } finally {
      vi.useRealTimers();
    }
  });
});
