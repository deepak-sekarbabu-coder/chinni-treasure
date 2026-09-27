import { vi, describe, it, expect, beforeEach } from "vitest";
import { createNextRequest } from "@/src/__tests__/utils/api-test";

const { checkRateLimit } = vi.hoisted(() => ({ checkRateLimit: vi.fn() }));
vi.mock("@/src/lib/rate-limiter", () => ({
  checkRateLimit,
  getClientIp: () => "1.2.3.4",
}));

import { POST } from "@/app/api/verify-payment/route";

const VALID_BODY = {
  razorpay_order_id: "order_1",
  razorpay_payment_id: "pay_1",
  razorpay_signature: "sig",
};

describe("POST /api/verify-payment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkRateLimit.mockResolvedValue({ allowed: true });
  });

  // The rate limit is the reason this route has a test: signature verification
  // is a guessing surface, so an over-limit caller must be refused before the
  // HMAC check is ever reached.
  it("returns 429 without verifying when the caller is over the limit", async () => {
    checkRateLimit.mockResolvedValue({ allowed: false });

    const response = await POST(
      createNextRequest("/api/verify-payment", {
        method: "POST",
        body: JSON.stringify(VALID_BODY),
      }),
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("60");
    const body = await response.json();
    expect(body.error).toContain("Too many verification attempts");
  });

  it("rate limits per IP under a verify-namespaced key", async () => {
    await POST(
      createNextRequest("/api/verify-payment", {
        method: "POST",
        body: JSON.stringify(VALID_BODY),
      }),
    );

    expect(checkRateLimit).toHaveBeenCalledWith("verify:1.2.3.4", 5);
  });
});
