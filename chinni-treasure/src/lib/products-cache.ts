import { createRedisCache } from "@/src/lib/redis-cache";

// Catalog invalidation is handled centrally via invalidateCatalogCaches()
// (src/lib/cache-invalidate.ts), so only get/set are exported here.
export const { get: getCached, set: setCache } = createRedisCache(30_000, "products");
