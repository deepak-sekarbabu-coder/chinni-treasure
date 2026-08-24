import { createRedisCache } from "@/src/lib/redis-cache";

/**
 * The Catalogue cache module.
 *
 * The catalogue is ONE concept: products, categories, the latest-per-category
 * block, category pages, and recent products are all invalidated together on
 * any catalogue mutation. Every namespace below is owned by this module —
 * routes import their caches from here instead of calling createRedisCache()
 * themselves, and invalidation clears exactly what this module owns (never a
 * hardcoded string list).
 */
export const productsCache = createRedisCache(30_000, "products");
// Full active-product index per hostname; public catalogue searches filter
// this list in memory instead of querying Postgres per keystroke.
export const catIndexCache = createRedisCache(60_000, "catindex");
export const categoriesCache = createRedisCache(300_000, "categories");
export const catLatestCache = createRedisCache(60_000, "catlatest");
export const catPageCache = createRedisCache(60_000, "catpage");
export const recentCache = createRedisCache(60_000, "recent");
export const giftBoxCache = createRedisCache(60_000, "giftboxes");

const CATALOGUE_CACHES = [
  productsCache,
  catIndexCache,
  categoriesCache,
  catLatestCache,
  catPageCache,
  recentCache,
  giftBoxCache,
] as const;

/**
 * Clear every cache owned by the catalogue — the namespace in Redis (SCAN +
 * DEL) plus the module's local in-memory fallback. Call after any product or
 * category create / update / delete.
 */
export async function invalidateCatalogCaches(): Promise<void> {
  await Promise.all(CATALOGUE_CACHES.map((cache) => cache.clear()));
}
