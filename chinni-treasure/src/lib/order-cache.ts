import { createRedisCache } from "@/src/lib/redis-cache";
import { statsCache } from "@/src/lib/stats-cache";
import { prisma } from "@/src/lib/prisma";
import { Prisma } from "@prisma/client";
import type { OrderView } from "@/src/lib/order-view";
import {
  buildTrackCacheKey,
  formatOrderResults,
  queryOrdersByOrderId,
  queryOrdersByPhone,
} from "@/src/lib/order-read";

/**
 * The Order cache module.
 *
 * Owns the order-detail and tracking caches, plus invalidation. Stats are
 * order-derived, so they are cleared alongside order caches on any order
 * mutation (placement, status change, tracking update) to keep the dashboard
 * fresh.
 */
const orderDetailCache = createRedisCache(30_000, "order");
export const trackingCache = createRedisCache(15_000, "track");

export type DetailedOrder = Prisma.OrderGetPayload<{
  include: { items: { include: { product: true } }; statusHistory: true };
}>;

/**
 * Read one order through the order-detail cache — the module's single order
 * detail pipeline. /api/orders/[id] and the SSR confirmation page both call
 * this, so invalidation (invalidateOrderCache(id) → orderDetailCache.remove)
 * reaches both with no extra wiring.
 */
export async function getOrderDetail(id: string): Promise<DetailedOrder | null> {
  const cached = (await orderDetailCache.get(id)) as DetailedOrder | null;
  if (cached) return cached;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } }, statusHistory: true },
  });
  if (!order) return null;
  await orderDetailCache.set(id, order);
  return order;
}

/** Tracking lookup: the projected orders, or the 400/404 the route maps. */
export type TrackResult = { error: string; status: number } | { orders: OrderView[] };

/**
 * Read orders through the tracking cache — the module's tracking surface.
 * `/api/track` only rate-limits, parses and envelopes; the cache key, the
 * hit/miss branch and the lookup's own 400 live here with the cache they name.
 */
export async function getTrackedOrders(
  orderId: string | null,
  phone: string | null,
): Promise<TrackResult> {
  const cacheKey = buildTrackCacheKey(orderId, phone);
  if (!cacheKey) return { error: "Provide orderId or phone parameter", status: 400 };

  const cached = (await trackingCache.get(cacheKey)) as OrderView[] | null;
  if (cached) return { orders: cached };

  const result = orderId ? await queryOrdersByOrderId(orderId) : await queryOrdersByPhone(phone!);
  if ("error" in result) return result;

  const orders = formatOrderResults(result.orders);
  await trackingCache.set(cacheKey, orders);
  return { orders };
}

/**
 * Clear order caches (the specific order detail key, all tracking keys) and
 * the order-derived stats cache. Call after any order mutation.
 */
export async function invalidateOrderCache(orderId?: string): Promise<void> {
  if (orderId) await orderDetailCache.remove(orderId);
  await trackingCache.clear();
  // Stats derive from orders — keep the dashboard fresh after status changes.
  await statsCache.clear();
}
