import { NextResponse } from "next/server";
import { z } from "zod";
import { withPublic } from "@/src/lib/route-guard";
import { validateOr400 } from "@/src/lib/validate";
import { createGatewayOrder } from "@/src/lib/razorpay-server";

export const runtime = "nodejs";

const CreateRazorpayOrderSchema = z.object({
  // Amount in rupees (the Pricing domain). The Payment module owns the paise
  // conversion and the minimum-order policy.
  amount: z.number().finite().positive("Amount must be greater than zero"),
  currency: z.string().length(3, "Currency must be a 3-letter code").default("INR"),
  receipt: z.string().min(1).max(40).optional(),
});

// POST /api/create-order — Create a Razorpay order for Standard Checkout.
// The guard owns the origin check, the rate limit and the error taxonomy;
// the Payment module owns the gateway call.
export const POST = withPublic(
  async ({ body }) => {
    const parsed = validateOr400(CreateRazorpayOrderSchema, body);
    if (!parsed.ok) return parsed.response;

    const { amount, currency, receipt } = parsed.data;
    const order = await createGatewayOrder(amount, { currency, receipt });
    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  },
  { rateLimit: "razorpay", parseBody: true, fallbackError: "Failed to create payment order" },
);
