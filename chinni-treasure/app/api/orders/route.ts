import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { validateOr400 } from "@/src/lib/validate";
import { checkRateLimit, getClientIp } from "@/src/lib/rate-limiter";
import { withAdmin } from "@/src/lib/admin-route";
import { Prisma, OrderStatus } from "@prisma/client";
import { z } from "zod";
import { placeOrder, parseCreateOrderInput, OrderError } from "@/src/lib/order-intake";
import { fetchRazorpayPayment, RazorpayGatewayError } from "@/src/lib/razorpay-server";

const ORDERS_LIST_SCHEMA = z.object({
  sort: z
    .enum(["date-desc", "date-asc", "total-desc", "total-asc"])
    .default("date-desc"),
});

const ORDER_SORTS: Record<
  "date-desc" | "date-asc" | "total-desc" | "total-asc",
  Prisma.OrderOrderByWithRelationInput
> = {
  "date-desc": { createdAt: "desc" },
  "date-asc": { createdAt: "asc" },
  "total-desc": { totalAmount: "desc" },
  "total-asc": { totalAmount: "asc" },
};

// GET /api/orders — List paginated orders (admin only)
export const GET = withAdmin(async ({ request }) => {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10")));
  const status = searchParams.get("status");
  const skip = (page - 1) * limit;

  const sortParse = validateOr400(ORDERS_LIST_SCHEMA, {
    sort: searchParams.get("sort") ?? undefined,
  });
  if (!sortParse.ok) return sortParse.response;
  const sort = sortParse.data.sort;

  const where = status ? { status: status as OrderStatus } : {};

  // Sequential queries to avoid saturating Nhost's pooler with
  // concurrent connections.
  const orders = await prisma.order.findMany({
    where,
    include: { items: { include: { product: true } } },
    orderBy: ORDER_SORTS[sort],
    skip,
    take: limit,
  });
  const total = await prisma.order.count({ where });

  return NextResponse.json({
    orders,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}, { fallbackError: "Failed to fetch orders" });

// POST /api/orders — Place a new order (thin adapter over the Order intake module).
// Public, rate-limited route: CSRF + rate limit are its own concerns, not the admin adapter's.
import { validateCsrfOrigin } from "@/src/lib/csrf";

export async function POST(request: Request) {
  const csrfError = validateCsrfOrigin(request);
  if (csrfError) return csrfError;

  const { allowed } = await checkRateLimit(`order:${getClientIp(request)}`, 3);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many order attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  try {
    const raw = await request.json();
    const input = parseCreateOrderInput(raw);

    // Resolve the authoritative paid amount from the gateway. The client's
    // claimed amount is never trusted: for Razorpay placements the payment
    // reference is looked up server-side, and the Order intake asserts
    // paid == stored (ADR-0002) before persisting.
    let resolvedPaidPaise: number | undefined;
    if (input.paymentGateway === "razorpay") {
      const payment = await fetchRazorpayPayment(input.transactionId);
      if (payment.orderId !== input.razorpayOrderId) {
        return NextResponse.json(
          { error: "Payment does not match this order. Please contact support." },
          { status: 400 },
        );
      }
      if (payment.status !== "captured" && payment.status !== "authorized") {
        return NextResponse.json(
          { error: "Payment has not been completed. Please try again or contact support." },
          { status: 400 },
        );
      }
      resolvedPaidPaise = payment.amount;
    }

    const order = await placeOrder(input, { resolvedPaidPaise });
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    if (error instanceof OrderError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    if (error instanceof RazorpayGatewayError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2034") {
        return NextResponse.json(
          { error: "Conflict detected. Please retry your order." },
          { status: 409 },
        );
      }
    }
    console.error("Failed to create order:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
