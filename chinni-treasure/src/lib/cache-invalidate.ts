import { redis } from "@/src/lib/redis";

/**
 * Scan and delete all Redis keys matching a set of namespace prefixes.
 * Uses SCAN to avoid blocking the Redis event loop.
 */
async function deleteByNamespaces(namespaces: string[]): Promise<void> {
  if (!redis) return;
  for (const ns of namespaces) {
    try {
      let cursor = "0";
      do {
        const [next, keys] = await redis.scan(cursor, "MATCH", `${ns}:*`, "COUNT", 100);
        cursor = next;
        if (keys.length > 0) await redis.del(...keys);
      } while (cursor !== "0");
    } catch {
      // Swallow — callers always have an in-memory fallback
    }
  }
}

/** Namespaces that hold product/category data (cleared on any catalog mutation). */
const CATALOG_NAMESPACES = ["products", "categories", "catlatest", "catpage", "recent"];

/**
 * Invalidate all catalog-related caches across every Vercel instance.
 * Call after any product or category create / update / delete.
 */
export async function invalidateCatalogCaches(): Promise<void> {
  await deleteByNamespaces(CATALOG_NAMESPACES);
}

/**
 * Invalidate order-specific caches (detail + tracking namespace).
 * Call after any order status change.
 */
export async function invalidateOrderCache(orderId?: string): Promise<void> {
  if (!redis) return;
  try {
    if (orderId) await redis.del(`order:${orderId}`);
  } catch {
    // Swallow
  }
  // Clear all tracking cache entries — we can't predict which key
  // the customer used to look up an order (order number vs. phone).
  await deleteByNamespaces(["track"]);
}
