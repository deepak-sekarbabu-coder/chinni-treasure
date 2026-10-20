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

/**
 * The order-number format the public lookup accepts: `ORD-` plus the eight
 * characters `generateOrderNumber` writes (`src/lib/utils.ts`). A fragment is
 * a wildcard, and a wildcard over order numbers is the whole customer list —
 * so the lookup takes the whole number or nothing.
 */
const ORDER_NUMBER_PATTERN = /^ORD-[A-Z0-9]{8}$/i;

/** The one message for a rejected order number. */
export const INVALID_ORDER_NUMBER = "Enter the full order number (e.g. ORD-2C218F0A)";

/** True for the exact order-number shape, false for any fragment of one. */
export function isOrderNumber(value: string): boolean {
  return ORDER_NUMBER_PATTERN.test(value);
}

/** Cache keys for order tracking: by order id, or by digits-only phone. */
export function buildTrackCacheKey(orderId: string | null, phone: string | null): string | null {
  if (orderId) return `o:${orderId}`;
  if (phone) return `p:${phone.replace(/\D/g, "")}`;
  return null;
}

/** Look up the one order with this full order number. */
export async function queryOrdersByOrderId(orderId: string): Promise<TrackQueryResult> {
  if (!isOrderNumber(orderId)) {
    return { error: INVALID_ORDER_NUMBER, status: 400 };
  }
  const orders = await prisma.order.findMany({
    where: { orderNumber: { equals: orderId, mode: "insensitive" } },
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

