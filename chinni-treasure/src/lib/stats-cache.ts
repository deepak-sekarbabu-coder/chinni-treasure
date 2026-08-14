import { createRedisCache } from "@/src/lib/redis-cache";

/** Dashboard statistics cache. Invalidation is owned by order-cache.ts. */
export const statsCache = createRedisCache(30_000, "stats");
