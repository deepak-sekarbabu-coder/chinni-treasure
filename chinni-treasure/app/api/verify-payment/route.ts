import { NextResponse } from "next/server";
import { validateCsrfOrigin } from "@/src/lib/csrf";
import { checkRateLimit, getClientIp } from "@/src/lib/rate-limiter";
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
// Thin adapter: CSRF + rate limit are their own concerns (this is a public
// route, so withAdmin does not apply), then parse, then the Payment module
// owns the HMAC check.
export async function POST(request: Request) {
  const csrfError = validateCsrfOrigin(request);
  if (csrfError) return csrfError;

  // Signature verification is a guessing surface — bound it per IP, as
  // create-order and track already do.
  const { allowed } = await checkRateLimit(`verify:${getClientIp(request)}`, 5);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many verification attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

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
      logger.error("Payment verification failed", { reason: "secret_missing" });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
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
}