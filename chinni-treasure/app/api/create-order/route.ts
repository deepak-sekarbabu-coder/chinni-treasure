import { NextResponse } from "next/server";
import { withPublic } from "@/src/lib/route-guard";
import { validateOr400 } from "@/src/lib/validate";
import { CreateRazorpayOrderInputSchema } from "@/src/lib/api/schemas";
import { createGatewayOrder } from "@/src/lib/razorpay-server";

export const runtime = "nodejs";

// POST /api/create-order — Create a Razorpay order for Standard Checkout.
// The guard owns the origin check, the rate limit and the error taxonomy;
// the Payment module owns the gateway call; the request shape is the client's
// own declaration (one contract, no drift).
export const POST = withPublic(
  async ({ body }) => {
    const parsed = validateOr400(CreateRazorpayOrderInputSchema, body);
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
