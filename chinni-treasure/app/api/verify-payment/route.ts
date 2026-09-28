import { NextResponse } from "next/server";
import { z } from "zod";
import { withPublic } from "@/src/lib/route-guard";
import { verifyCheckoutSignature, RazorpayGatewayError } from "@/src/lib/razorpay-server";
import { logger } from "@/lib/axiom/server";

export const runtime = "nodejs";

const VerifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1, "razorpay_order_id is required"),
  razorpay_payment_id: z.string().min(1, "razorpay_payment_id is required"),
  razorpay_signature: z.string().min(1, "razorpay_signature is required"),
});

// POST /api/verify-payment — Verify the Razorpay payment signature.
// Signature verification is a guessing surface, so the guard's named policy
// bounds it per IP; the Payment module owns the HMAC check.
export const POST = withPublic(
  async ({ body }) => {
    const parsed = VerifyPaymentSchema.safeParse(body);
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
        logger.error("Payment verification failed", { reason: "secret_missing" });
      }
      // The guard's taxonomy keeps the gateway error's own status.
      throw error;
    }

    if (!signatureMatches) {
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
  },
  { rateLimit: "verify", parseBody: true, fallbackError: "Payment verification failed" },
);
