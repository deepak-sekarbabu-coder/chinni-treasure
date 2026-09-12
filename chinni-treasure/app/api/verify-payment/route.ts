import { NextResponse } from "next/server";
import { validateCsrfOrigin } from "@/src/lib/csrf";
import { verifyCheckoutSignature, RazorpayGatewayError } from "@/src/lib/razorpay-server";
import { logger } from "@/lib/axiom/server";
import { z } from "zod";

export const runtime = "nodejs";

const VerifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1, "razorpay_order_id is required"),
  razorpay_payment_id: z.string().min(1, "razorpay_payment_id is required"),
  razorpay_signature: z.string().min(1, "razorpay_signature is required"),
});

// POST /api/verify-payment — Verify the Razorpay payment signature.
// Thin adapter: parse, then the Payment module owns the HMAC check.
export async function POST(request: Request) {
  const csrfError = validateCsrfOrigin(request);
  if (csrfError) return csrfError;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = VerifyPaymentSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Missing required payment fields" },
      { status: 400 },
    );
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  let signatureMatches: boolean;
  try {
    signatureMatches = verifyCheckoutSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    );
  } catch (error) {
    if (error instanceof RazorpayGatewayError) {
      console.error("[verify-payment] Razorpay secret is not configured");
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    throw error;
  }

  if (!signatureMatches) {
    console.warn("[verify-payment] Signature mismatch for order", razorpay_order_id);
    logger.warn("Payment verification failed", {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      reason: "signature_mismatch",
    });
    return NextResponse.json(
      { ok: false, error: "Payment verification failed" },
      { status: 400 },
    );
  }

  logger.info("Payment verified", {
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
  });

  return NextResponse.json({
    ok: true,
    order_id: razorpay_order_id,
    payment_id: razorpay_payment_id,
  });
}