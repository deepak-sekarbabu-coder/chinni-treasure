import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { withAdmin, withPublic } from "@/src/lib/route-guard";
import { placeOrder, parseCreateOrderInput } from "@/src/lib/order-intake";
import { listOrdersForAdmin } from "@/src/lib/order-read";
import { acceptPlacementPayment } from "@/src/lib/razorpay-server";
import { invalidateOrderCache } from "@/src/lib/order-cache";
import { parseListQuery, totalPages } from "@/src/lib/list-query";
import { LIST_QUERY_LIMITS } from "@/src/lib/constants";

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
    ...LIST_QUERY_LIMITS.orders,
    sortMap: ORDER_SORTS,
  });
  if (parsedQuery instanceof NextResponse) return parsedQuery;
  const { page, limit, skip, sort } = parsedQuery;
  const status = new URL(request.url).searchParams.get("status");
  const sortOrder = ORDER_SORTS[sort as keyof typeof ORDER_SORTS];

  // The query lives in the Order read module; the route parses and envelopes.
  const { orders, total } = await listOrdersForAdmin({
    status: status ?? undefined,
    orderBy: sortOrder,
    skip,
    take: limit,
  });

  return NextResponse.json({
    orders,
    total,
    page,
    limit,
    totalPages: totalPages(total, limit),
  });
}, { fallbackError: "Failed to fetch orders" });

// POST /api/orders — Place a new order.
// Public route: the route guard owns the origin check, the rate limit, the body
// parse and the error taxonomy; the Order intake module owns placement.
export const POST = withPublic(
  async ({ body }) => {
    const input = parseCreateOrderInput(body);

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
  },
  {
    rateLimit: "order",
    parseBody: true,
    fallbackError: "Failed to create order",
    // A serializable placement can hit a write conflict; the retry wording is
    // this route's, the 409 mapping is the guard's.
    errorMessages: { p2034: "Conflict detected. Please retry your order." },
  },
);
