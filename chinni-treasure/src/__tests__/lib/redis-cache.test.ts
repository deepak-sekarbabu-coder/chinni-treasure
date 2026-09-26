import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { createRedisCache } from "@/src/lib/redis-cache";
import { invalidateCatalogCaches } from "@/src/lib/catalogue-cache";
import { invalidateOrderCache } from "@/src/lib/order-cache";

// The global test setup (src/__tests__/setup.ts) mocks @/src/lib/redis with
// `{ redis: null }`, so `createRedisCache` exercises its in-memory fallback
// here — exactly the behavior you get when REDIS_URL is unset.

describe("createRedisCache (in-memory fallback)", () => {
  // TTL expiry tests rely on vi.useFakeTimers() faking Date (createCache
  // checks `Date.now()`), matching the rate-limiter.test.ts pattern.
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null for a missing key", async () => {
    const cache = createRedisCache(30_000, "products");
    await expect(cache.get("nope")).resolves.toBeNull();
  });

  it("stores and retrieves values", async () => {
    const cache = createRedisCache<{ id: number }>(30_000, "products");
    await cache.set("p1", { id: 1 });
    await expect(cache.get("p1")).resolves.toEqual({ id: 1 });
  });

  it("preserves falsy values (0, false, empty string)", async () => {
    const cache = createRedisCache(30_000, "products");
    await cache.set("zero", 0);
    await cache.set("no", false);
    await cache.set("empty", "");
    await expect(cache.get("zero")).resolves.toBe(0);
    await expect(cache.get("no")).resolves.toBe(false);
    await expect(cache.get("empty")).resolves.toBe("");
  });

  it("overwrites an existing key", async () => {
    const cache = createRedisCache<string>(30_000, "products");
    await cache.set("k", "first");
    await cache.set("k", "second");
    await expect(cache.get("k")).resolves.toBe("second");
  });

  it("expires entries after the TTL", async () => {
    const cache = createRedisCache<number>(1_000, "products");
    await cache.set("k", 42);
    await expect(cache.get("k")).resolves.toBe(42);

    vi.advanceTimersByTime(1_001);
    await expect(cache.get("k")).resolves.toBeNull();
  });

  it("keeps entries within the TTL window", async () => {
    const cache = createRedisCache<number>(10_000, "products");
    await cache.set("k", 7);
    vi.advanceTimersByTime(9_999);
    await expect(cache.get("k")).resolves.toBe(7);
  });

  it("clear() removes all entries for that instance", async () => {
    const cache = createRedisCache(30_000, "products");
    await cache.set("a", 1);
    await cache.set("b", 2);
    await cache.clear();
    await expect(cache.get("a")).resolves.toBeNull();
    await expect(cache.get("b")).resolves.toBeNull();
  });

  it("isolates separate cache instances from each other", async () => {
    const cacheA = createRedisCache(30_000, "products");
    const cacheB = createRedisCache(30_000, "products");
    await cacheA.set("shared-key", "from-A");
    await expect(cacheB.get("shared-key")).resolves.toBeNull();
  });
});

describe("invalidate helpers (no Redis connected)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("invalidateCatalogCaches resolves without error when redis is null", async () => {
    await expect(invalidateCatalogCaches()).resolves.toBeUndefined();
  });

  it("invalidateOrderCache resolves without error when redis is null", async () => {
    await expect(invalidateOrderCache("order-1")).resolves.toBeUndefined();
  });
});
