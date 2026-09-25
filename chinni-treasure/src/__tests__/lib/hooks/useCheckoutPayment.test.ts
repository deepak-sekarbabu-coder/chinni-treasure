import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type {
  RazorpayOptions,
  RazorpayResponse,
} from "@/src/types/razorpay";

vi.mock("@/src/lib/api", () => ({
  createRazorpayOrder: vi.fn(),
  verifyRazorpayPayment: vi.fn(),
}));
vi.mock("@/src/lib/razorpay", () => ({
  loadRazorpayScript: vi.fn(),
}));

import { createRazorpayOrder, verifyRazorpayPayment } from "@/src/lib/api";
import { loadRazorpayScript } from "@/src/lib/razorpay";
import {
  useCheckoutPayment,
  type RazorpayOutcome,
} from "../../../lib/hooks/useCheckoutPayment";

// A fake Razorpay constructor: captures the options passed to it and stubs the
// instance surface so each test can drive handler / ondismiss / payment.failed.
let capturedOptions: RazorpayOptions | null = null;
let failHandler: ((response: { error?: { description?: string } }) => void) | null = null;
const FakeRazorpay = vi.fn().mockImplementation(function (
  this: { open: () => void; on: (event: string, handler: (r: unknown) => void) => void },
  options: RazorpayOptions,
) {
  capturedOptions = options;
  failHandler = null;
  this.open = vi.fn();
  this.on = (event, handler) => {
    if (event === "payment.failed") {
      failHandler = handler as (r: { error?: { description?: string } }) => void;
    }
  };
});

function validResponse(): RazorpayResponse {
  return {
    razorpay_order_id: "order_1",
    razorpay_payment_id: "pay_1",
    razorpay_signature: "sig_1",
  };
}

let placeOrderInput: unknown = null;

/**
 * Starts a capture and drives it to completion. Failure paths that never open
 * the checkout pass `{ opensCapture: false }` — the drive step is skipped.
 */
async function run(
  drive: () => void,
  opts: { opensCapture?: boolean } = {},
): Promise<{ result: ReturnType<typeof renderHook<typeof useCheckoutPayment>>; outcome: RazorpayOutcome }> {
  const { result } = renderHook(() => useCheckoutPayment());
  let resolved!: RazorpayOutcome;
  await act(async () => {
    const p = result.current.payWithRazorpay({
      amount: 1000,
      prefill: { name: "Ada", email: "ada@example.com", contact: "9876543210" },
      placeOrder: async (placement) => {
        placeOrderInput = placement;
        return { id: "ORD-1" };
      },
    });
    if (opts.opensCapture !== false) {
      await vi.waitFor(() => expect(capturedOptions).not.toBeNull());
      drive();
    }
    resolved = await p;
  });
  return { result, outcome: resolved };
}

describe("useCheckoutPayment", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = "rzp_test_key";
    capturedOptions = null;
    failHandler = null;
    placeOrderInput = null;
    vi.mocked(loadRazorpayScript).mockResolvedValue(FakeRazorpay as never);
    vi.mocked(createRazorpayOrder).mockResolvedValue({
      order_id: "order_1",
      amount: 1000,
      currency: "INR",
    } as never);
    vi.mocked(verifyRazorpayPayment).mockResolvedValue({ ok: true } as never);
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    vi.clearAllMocks();
  });

  it("places the order when the signature verifies", async () => {
    const { outcome } = await run(() => {
      capturedOptions!.handler!(validResponse());
    });
    expect(outcome).toEqual({ ok: true, orderId: "ORD-1" });
    expect(placeOrderInput).toEqual({
      paymentGateway: "razorpay",
      transactionId: "pay_1",
      razorpayOrderId: "order_1",
    });
  });

  it("reports an unverified signature without placing the order", async () => {
    vi.mocked(verifyRazorpayPayment).mockResolvedValue({ ok: false } as never);
    const { outcome } = await run(() => {
      capturedOptions!.handler!(validResponse());
    });
    expect(outcome).toMatchObject({
      ok: false,
      reason: "error",
      message: "Payment verification failed. Please contact support.",
    });
    expect(placeOrderInput).toBeNull();
  });

  it("reports a cancelled checkout on dismiss", async () => {
    const { outcome } = await run(() => {
      capturedOptions!.modal!.ondismiss!();
    });
    expect(outcome).toMatchObject({ ok: false, reason: "cancelled" });
    expect(placeOrderInput).toBeNull();
  });

  it("reports the gateway error description on payment.failed", async () => {
    const { outcome } = await run(() => {
      failHandler!({ error: { description: "Your card was declined" } });
    });
    expect(outcome).toMatchObject({
      ok: false,
      reason: "failed",
      message: "Payment failed: Your card was declined",
    });
  });

  it("fails fast when Razorpay is not configured", async () => {
    delete process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const { outcome } = await run(() => {}, { opensCapture: false });
    expect(outcome).toEqual({
      ok: false,
      reason: "error",
      message: "Razorpay is not configured on this site",
    });
    expect(createRazorpayOrder).not.toHaveBeenCalled();
  });

  it("surfaces a gateway-order creation failure", async () => {
    vi.mocked(createRazorpayOrder).mockRejectedValue(new Error("Gateway down"));
    const { outcome } = await run(() => {}, { opensCapture: false });
    expect(outcome).toMatchObject({ ok: false, reason: "error", message: "Gateway down" });
  });

  it("clears `processing` after the capture resolves", async () => {
    const { result, outcome } = await run(() => {
      capturedOptions!.handler!(validResponse());
    });
    expect(outcome.ok).toBe(true);
    expect(result.current.processing).toBe(false);
  });
});