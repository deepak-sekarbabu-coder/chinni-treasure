import { vi, describe, it, expect, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { createNextRequest } from "@/src/__tests__/utils/api-test";

// The route guard applies the named policy; null == allowed.
const { guardRateLimit } = vi.hoisted(() => ({ guardRateLimit: vi.fn() }));
vi.mock("@/src/lib/rate-limiter", () => ({
  guardRateLimit,
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
    guardRateLimit.mockResolvedValue(null);
  });

  // The rate limit is the reason this route has a test: signature verification
  // is a guessing surface, so an over-limit caller must be refused before the
  // HMAC check is ever reached.
  it("returns the guard's refusal without verifying when the caller is over the limit", async () => {
    guardRateLimit.mockResolvedValue(
      NextResponse.json(
        { error: "Too many verification attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": "60" } },
      ),
    );

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

  it("bounds verification under the named verify policy, not a hand-built key", async () => {
    await POST(
      createNextRequest("/api/verify-payment", {
        method: "POST",
        body: JSON.stringify(VALID_BODY),
      }),
    );

    expect(guardRateLimit).toHaveBeenCalledWith("verify", expect.any(Request));
  });
});
