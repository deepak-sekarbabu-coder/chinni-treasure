import { createRedisCache } from "@/src/lib/redis-cache";
import { computeDashboardStats, type DashboardStats } from "@/src/lib/stats";

/** Dashboard statistics cache. Invalidation is owned by order-cache.ts. */
export const statsCache = createRedisCache(30_000, "stats");

/**
 * Read the dashboard stats through the cache — the module's stats surface.
 * `/api/stats` only envelopes and maps errors; the key, the hit/miss branch and
 * the computation all live here.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const cached = (await statsCache.get("stats")) as DashboardStats | null;
  if (cached) return cached;
  const payload = await computeDashboardStats();
  await statsCache.set("stats", payload);
  return payload;
}
