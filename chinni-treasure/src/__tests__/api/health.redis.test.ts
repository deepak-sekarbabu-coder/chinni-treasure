import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/health/redis/route";

// No per-file mock override here: the global setup.ts mock
// (`@/src/lib/redis` -> `redis: null`) covers the "not configured" path —
// i.e. what happens when REDIS_URL is unset in production.
describe("GET /api/health/redis (not configured)", () => {
  it("returns ok/not_configured with 200 when REDIS_URL is unset", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok", redis: "not_configured" });
  });
});
