import { createRedisCache } from "@/src/lib/redis-cache";
import { statsCache } from "@/src/lib/stats-cache";

/**
 * The Order cache module.
 *
 * Owns the order-detail and tracking caches, plus invalidation. Stats are
 * order-derived, so they are cleared alongside order caches on any order
 * mutation (status change / tracking update) to keep the dashboard fresh.
 */
export const orderDetailCache = createRedisCache(30_000, "order");
export const trackingCache = createRedisCache(15_000, "track");

/**
 * Clear order caches (the specific order detail key, all tracking keys) and
 * the order-derived stats cache. Call after any order status change.
 */
export async function invalidateOrderCache(orderId?: string): Promise<void> {
  if (orderId) await orderDetailCache.remove(orderId);
  await trackingCache.clear();
  // Stats derive from orders — keep the dashboard fresh after status changes.
  await statsCache.clear();
}
