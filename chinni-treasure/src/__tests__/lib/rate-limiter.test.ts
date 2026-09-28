import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { guardRateLimit, RATE_LIMIT_POLICIES } from "../../lib/rate-limiter";

/** A POST from a given IP — the limiter reads the forwarded header itself. */
function requestFrom(ip: string): Request {
  return new Request("http://localhost:3000/api/x", {
    method: "POST",
    headers: { "x-forwarded-for": ip },
  });
}

async function attempt(policy: Parameters<typeof guardRateLimit>[0], ip: string) {
  return guardRateLimit(policy, requestFrom(ip));
}

describe("guardRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows attempts up to the policy ceiling and refuses the next with its wording", async () => {
    const { max, message } = RATE_LIMIT_POLICIES.order;

    for (let i = 0; i < max; i++) {
      expect(await attempt("order", "ceiling-ip")).toBeNull();
    }

    const refusal = await attempt("order", "ceiling-ip");
    expect(refusal?.status).toBe(429);
    expect(refusal?.headers.get("Retry-After")).toBe("60");
    expect(await refusal?.json()).toEqual({ error: message });
  });

  it("applies each policy's own ceiling", async () => {
    // order allows 3; track allows 10. If the policy table stopped driving the
    // count, one of these would flip.
    for (let i = 0; i < RATE_LIMIT_POLICIES.order.max; i++) {
      await attempt("order", "distinct-ip");
    }
    expect(await attempt("order", "distinct-ip")).not.toBeNull();
    expect(await attempt("track", "distinct-ip")).toBeNull();
  });

  it("counts each IP independently", async () => {
    for (let i = 0; i < RATE_LIMIT_POLICIES.verify.max; i++) {
      await attempt("verify", "ip-a");
    }
    expect(await attempt("verify", "ip-a")).not.toBeNull();
    expect(await attempt("verify", "ip-b")).toBeNull();
  });

  it("counts each policy independently for the same IP", async () => {
    for (let i = 0; i < RATE_LIMIT_POLICIES.order.max; i++) {
      await attempt("order", "shared-ip");
    }
    expect(await attempt("order", "shared-ip")).not.toBeNull();
    expect(await attempt("razorpay", "shared-ip")).toBeNull();
  });

  it("resets after the window expires", async () => {
    for (let i = 0; i < RATE_LIMIT_POLICIES.login.max; i++) {
      await attempt("login", "window-ip");
    }
    expect(await attempt("login", "window-ip")).not.toBeNull();

    vi.advanceTimersByTime(60_001);

    expect(await attempt("login", "window-ip")).toBeNull();
  });

  it("counts an unidentified client under the shared 'unknown' bucket", async () => {
    const bare = () =>
      guardRateLimit("login", new Request("http://localhost:3000/api/x", { method: "POST" }));

    for (let i = 0; i < RATE_LIMIT_POLICIES.login.max; i++) {
      expect(await bare()).toBeNull();
    }
    expect(await bare()).not.toBeNull();
  });
});
