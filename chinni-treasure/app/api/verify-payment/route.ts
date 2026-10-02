import { NextResponse } from "next/server";
import { withPublic } from "@/src/lib/route-guard";
import { validateOr400 } from "@/src/lib/validate";
import { VerifyRazorpayPaymentInputSchema } from "@/src/lib/api/schemas";
import { verifyCheckoutSignature, RazorpayGatewayError } from "@/src/lib/razorpay-server";
import { logger } from "@/lib/axiom/server";

export const runtime = "nodejs";

// POST /api/verify-payment — Verify the Razorpay payment signature.
// Signature verification is a guessing surface, so the guard's named policy
// bounds it per IP; the Payment module owns the HMAC check. The field contract
// is the client's own (one declaration, no drift).
export const POST = withPublic(
  async ({ body }) => {
    const parsed = validateOr400(VerifyRazorpayPaymentInputSchema, body);
    if (!parsed.ok) return parsed.response;

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
