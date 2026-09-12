import { NextResponse } from "next/server";
import { validateCsrfOrigin } from "@/src/lib/csrf";
import { validateOr400 } from "@/src/lib/validate";
import { checkRateLimit, getClientIp } from "@/src/lib/rate-limiter";
import { createGatewayOrder, RazorpayGatewayError } from "@/src/lib/razorpay-server";
import { z } from "zod";

export const runtime = "nodejs";

const CreateRazorpayOrderSchema = z.object({
  // Amount in rupees (the Pricing domain). The Payment module owns the paise
  // conversion and the minimum-order policy.
  amount: z.number().finite().positive("Amount must be greater than zero"),
  currency: z.string().length(3, "Currency must be a 3-letter code").default("INR"),
  receipt: z.string().min(1).max(40).optional(),
});

// POST /api/create-order — Create a Razorpay order for Standard Checkout
// Thin adapter: CSRF + rate limit are its own concerns, then
// parse → Payment module call → error mapping.
export async function POST(request: Request) {
  const csrfError = validateCsrfOrigin(request);
  if (csrfError) return csrfError;

  const { allowed } = await checkRateLimit(`razorpay:${getClientIp(request)}`, 5);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many payment attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = validateOr400(CreateRazorpayOrderSchema, raw);
  if (!parsed.ok) return parsed.response;

  const { amount, currency, receipt } = parsed.data;
  try {
    const order = await createGatewayOrder(amount, { currency, receipt });
    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    if (error instanceof RazorpayGatewayError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[create-order] Unexpected error:", error);
    return NextResponse.json({ error: "Failed to create payment order" }, { status: 500 });
  }
}