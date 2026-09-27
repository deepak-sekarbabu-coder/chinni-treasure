import { prisma } from "@/src/lib/prisma";
import type { Prisma } from "@prisma/client";
import { OrderStatus } from "@prisma/client";
import { fieldIssue } from "@/src/lib/checkout-fields";
import { toOrderView, type OrderView } from "@/src/lib/order-view";

/** An order row carrying the items and status history the view projects. */
export type OrderWithTimeline = Prisma.OrderGetPayload<{
  include: { items: true; statusHistory: true };
}>;

export type TrackQueryResult =
  | { error: string; status: number }
  | { orders: OrderWithTimeline[] };

/** Cache keys for order tracking: by order id, or by digits-only phone. */
export function buildTrackCacheKey(orderId: string | null, phone: string | null): string | null {
  if (orderId) return `o:${orderId}`;
  if (phone) return `p:${phone.replace(/\D/g, "")}`;
  return null;
}

/** Look up orders matching an order id/number fragment. */
export async function queryOrdersByOrderId(orderId: string): Promise<TrackQueryResult> {
  if (orderId.length > 36 || !/^[a-zA-Z0-9-]+$/.test(orderId)) {
    return { error: "Invalid order ID format", status: 400 };
  }
  const orders = await prisma.order.findMany({
    where: { orderNumber: { contains: orderId, mode: "insensitive" } },
    include: { items: true, statusHistory: true },
    orderBy: { createdAt: "desc" },
  });
  return { orders };
}

/** Look up orders by a 10-digit Indian phone number. */
export async function queryOrdersByPhone(phone: string): Promise<TrackQueryResult> {
  const cleanPhone = phone.replace(/\D/g, "");
  // The shared field contract owns the rule and the wording — this used to
  // hand-copy both, so a change to the checkout phone rule missed the tracker.
  const issue = fieldIssue("customerPhone", cleanPhone);
  if (issue) {
    return { error: issue, status: 400 };
  }
  const orders = await prisma.order.findMany({
    where: { customerPhone: cleanPhone },
    include: { items: true, statusHistory: true },
    orderBy: { createdAt: "desc" },
  });
  return { orders };
}

/**
 * Project the tracking results into the shared Order view — the same
 * projection the confirmation page and invoice use, so a surface fed by
 * tracking renders the same money, the same line nesting and the same timeline
 * as one fed by the order detail.
 */
export function formatOrderResults(orders: readonly OrderWithTimeline[]): OrderView[] {
  return orders.map(toOrderView);
}

/** An admin order list row: items with their product, for the orders table. */
export type AdminOrderRow = Prisma.OrderGetPayload<{
  include: { items: { include: { product: true } } };
}>;

export type AdminOrderSort = "date-desc" | "date-asc" | "total-desc" | "total-asc";

/**
 * The admin orders list read — the order-side sibling of `listProductsForQuery`.
 *
 * The dashboard needs the full row (including `adminNotes`, which is
 * deliberately never projected into an OrderView: the tracking surface is
 * unauthenticated, this one is not). What this owns is the query itself, so
 * `GET /api/orders` is not the one order surface that reaches past this module
 * straight into Prisma. Sequential queries, not Promise.all — concurrent
 * queries saturate Nhost's pooler.
 */
export async function listOrdersForAdmin(params: {
  status?: string;
  orderBy: Prisma.OrderOrderByWithRelationInput;
  skip: number;
  take: number;
}): Promise<{ orders: AdminOrderRow[]; total: number }> {
  const where: Prisma.OrderWhereInput = params.status
    ? { status: params.status as OrderStatus }
    : {};
  const orders = await prisma.order.findMany({
    where,
    include: { items: { include: { product: true } } },
    orderBy: params.orderBy,
    skip: params.skip,
    take: params.take,
  });
  const total = await prisma.order.count({ where });
  return { orders, total };
}

