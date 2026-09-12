import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { checkRateLimit, getClientIp } from "@/src/lib/rate-limiter";
import { withAdmin } from "@/src/lib/admin-route";
import { Prisma, OrderStatus } from "@prisma/client";
import { placeOrder, parseCreateOrderInput, OrderError } from "@/src/lib/order-intake";
import { acceptPlacementPayment, RazorpayGatewayError } from "@/src/lib/razorpay-server";
import { invalidateOrderCache } from "@/src/lib/order-cache";
import { parseListQuery, totalPages } from "@/src/lib/list-query";

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
  const parsedQuery = parseListQuery(new URL(request.url).searchParams, {
    defaultLimit: 10,
    maxLimit: 100,
    defaultSort: "date-desc",
    sortMap: ORDER_SORTS,
  });
  if (parsedQuery instanceof NextResponse) return parsedQuery;
  const { page, limit, skip, sort } = parsedQuery;
  const status = new URL(request.url).searchParams.get("status");
  const sortOrder = ORDER_SORTS[sort as keyof typeof ORDER_SORTS];

  const where = status ? { status: status as OrderStatus } : {};

  // Sequential queries to avoid saturating Nhost's pooler with
  // concurrent connections.
  const orders = await prisma.order.findMany({
    where,
    include: { items: { include: { product: true } } },
    orderBy: sortOrder,
    skip,
    take: limit,
  });
  const total = await prisma.order.count({ where });

  return NextResponse.json({
    orders,
    total,
    page,
    limit,
    totalPages: totalPages(total, limit),
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
    // claimed amount is never trusted: the Payment module applies the
    // acceptance policy (payment belongs to this order, captured/authorized)
    // and returns the snapshot, then the Order intake asserts paid == stored
    // (ADR-0002) before persisting.
    let resolvedPaidPaise: number | undefined;
    if (input.paymentGateway === "razorpay") {
      const payment = await acceptPlacementPayment(input.transactionId, input.razorpayOrderId!);
      resolvedPaidPaise = payment.amount;
    }

    const order = await placeOrder(input, { resolvedPaidPaise });
    await invalidateOrderCache(order.id);
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
