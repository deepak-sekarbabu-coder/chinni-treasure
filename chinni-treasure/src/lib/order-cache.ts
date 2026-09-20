import { createRedisCache } from "@/src/lib/redis-cache";
import { statsCache } from "@/src/lib/stats-cache";
import { prisma } from "@/src/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * The Order cache module.
 *
 * Owns the order-detail and tracking caches, plus invalidation. Stats are
 * order-derived, so they are cleared alongside order caches on any order
 * mutation (placement, status change, tracking update) to keep the dashboard
 * fresh.
 */
export const orderDetailCache = createRedisCache(30_000, "order");
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
