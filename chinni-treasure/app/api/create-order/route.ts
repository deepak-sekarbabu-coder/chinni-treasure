import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { validateCsrfOrigin } from "@/src/lib/csrf";
import { z } from "zod";

export const runtime = "nodejs";

const MIN_AMOUNT_PAISE = 100;

const CreateRazorpayOrderSchema = z.object({
  amount: z
    .number()
    .int("Amount must be an integer (in paise)")
    .positive("Amount must be greater than zero"),
  currency: z.string().length(3, "Currency must be a 3-letter code").default("INR"),
  receipt: z.string().min(1).max(40).optional(),
});

// POST /api/create-order — Create a Razorpay order for Standard Checkout
export async function POST(request: Request) {
  const csrfError = validateCsrfOrigin(request);
  if (csrfError) return csrfError;

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    console.error("[create-order] Razorpay credentials are not configured");
    return NextResponse.json({ error: "Payment gateway is not configured" }, { status: 500 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = CreateRazorpayOrderSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 },
    );
  }

  const { amount, currency, receipt } = parsed.data;
  if (amount < MIN_AMOUNT_PAISE) {
    return NextResponse.json(
      { error: `Minimum order amount is ${MIN_AMOUNT_PAISE} paise` },
      { status: 400 },
    );
  }

  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

  try {
    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt: receipt ?? `CT-${Date.now()}`,
    });

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    const statusCode = (error as { statusCode?: number })?.statusCode;
    console.error("[create-order] Razorpay API error:", statusCode ?? "", error);
    if (statusCode === 401) {
      return NextResponse.json({ error: "Payment gateway authentication failed" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to create payment order" }, { status: 500 });
  }
}
