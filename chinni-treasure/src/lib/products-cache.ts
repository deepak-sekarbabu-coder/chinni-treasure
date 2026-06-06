import { createCache } from "@/src/lib/cache";

export const { get: getCached, set: setCache, clear: clearCache } = createCache(30_000);
