import { prisma } from "@/src/lib/prisma";
import type { Prisma } from "@prisma/client";
import { toOrderView, type OrderView } from "@/src/lib/order-view";

/** An order row carrying the items and status history the view projects. */
export type OrderWithTimeline = Prisma.OrderGetPayload<{
  include: { items: true; statusHistory: true };
}>;

export type TrackQueryResult =
  | { error: string; status: number }
  | { orders: OrderWithTimeline[] }
  | null;

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
  if (cleanPhone.length !== 10) {
    return { error: "Phone must be exactly 10 digits", status: 400 };
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
