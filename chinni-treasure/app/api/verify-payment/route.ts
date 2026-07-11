import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { validateCsrfOrigin } from "@/src/lib/csrf";
import { z } from "zod";

export const runtime = "nodejs";

const VerifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1, "razorpay_order_id is required"),
  razorpay_payment_id: z.string().min(1, "razorpay_payment_id is required"),
  razorpay_signature: z.string().min(1, "razorpay_signature is required"),
});

// POST /api/verify-payment — Verify the Razorpay payment signature
// Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
export async function POST(request: Request) {
  const csrfError = validateCsrfOrigin(request);
  if (csrfError) return csrfError;

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    console.error("[verify-payment] Razorpay secret is not configured");
    return NextResponse.json({ error: "Payment gateway is not configured" }, { status: 500 });
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

  const expectedSignature = createHmac("sha256", keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedSignature);
  const receivedBuffer = Buffer.from(razorpay_signature);

  const signatureMatches =
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer);

  if (!signatureMatches) {
    console.warn("[verify-payment] Signature mismatch for order", razorpay_order_id);
    return NextResponse.json(
      { ok: false, error: "Payment verification failed" },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    order_id: razorpay_order_id,
    payment_id: razorpay_payment_id,
  });
}
