import { redis } from "@/src/lib/redis";
import { createCache } from "@/src/lib/cache";

export function createRedisCache<T = unknown>(ttlMs: number, namespace: string) {
  const fallback = createCache<T>(ttlMs);
  const ttlSeconds = Math.max(1, Math.ceil(ttlMs / 1000));

  return {
    async get(key: string): Promise<T | null> {
      if (!redis) return fallback.get(key);
      try {
        const raw = await redis.get(`${namespace}:${key}`);
        if (raw == null) return null;
        return JSON.parse(raw) as T;
      } catch {
        return fallback.get(key);
      }
    },
    async set(key: string, data: T): Promise<void> {
      if (!redis) return fallback.set(key, data);
      try {
        await redis.set(`${namespace}:${key}`, JSON.stringify(data), "EX", ttlSeconds);
      } catch {
        fallback.set(key, data);
      }
    },
    async clear(): Promise<void> {
      fallback.clear();
      if (!redis) return;
      try {
        let cursor = "0";
        do {
          const [next, keys] = await redis.scan(cursor, "MATCH", `${namespace}:*`, "COUNT", 100);
          cursor = next;
          if (keys.length > 0) await redis.del(...keys);
        } while (cursor !== "0");
      } catch {
        // Fallback already cleared above
      }
    },
  };
}
