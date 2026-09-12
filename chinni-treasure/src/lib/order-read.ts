import { prisma } from "@/src/lib/prisma";
import type { Order, OrderItem } from "@prisma/client";

export type TrackQueryResult =
  | { error: string; status: number }
  | { orders: (Order & { items: OrderItem[] })[] }
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
    include: { items: true },
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
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  return { orders };
}

/** Project order rows into the public tracking shape. */
export function formatOrderResults(orders: (Order & { items: OrderItem[] })[]) {
  return orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    trackingId: o.trackingId || null,
    totalAmount: Number(o.totalAmount),
    createdAt: o.createdAt,
    itemCount: (o.items || []).reduce((sum, i) => sum + i.quantity, 0),
    items: (o.items || []).map((i) => ({
      id: i.id,
      productName: i.productName,
      unitPrice: Number(i.unitPrice),
      quantity: i.quantity,
    })),
  }));
}