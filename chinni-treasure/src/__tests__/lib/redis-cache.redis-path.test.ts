import { vi, describe, it, expect, beforeEach } from "vitest";
import { createMockRedis } from "@/src/__tests__/mocks/redis";

// This file overrides the global `redis: null` setup mock with a fake Redis
// client so we can exercise the Redis-backed path of createRedisCache.
// The factory creates the instance itself (no top-level variable to hoist),
// and the same cached instance is imported back below for assertions.

vi.mock("@/src/lib/redis", () => ({ redis: createMockRedis() }));

import { redis } from "@/src/lib/redis";
import { createRedisCache } from "@/src/lib/redis-cache";

const mockRedis = redis as unknown as ReturnType<typeof createMockRedis>;

describe("createRedisCache (Redis available)", () => {
  beforeEach(() => {
    mockRedis.reset();
    vi.clearAllMocks();
  });

  it("returns null when the key is missing in Redis", async () => {
    const cache = createRedisCache(30_000, "products");
    await expect(cache.get("missing")).resolves.toBeNull();
  });

  it("namespaces keys under the cache namespace", async () => {
    const cache = createRedisCache(30_000, "products");
    await cache.set("p1", { id: 1 });
    expect(mockRedis.store.has("p1")).toBe(false);
    expect(mockRedis.store.get("products:p1")).toBe('{"id":1}');
  });

  it("stores JSON and reads it back", async () => {
    const cache = createRedisCache<{ id: number; name: string }>(30_000, "products");
    await cache.set("p1", { id: 1, name: "Ring" });
    await expect(cache.get("p1")).resolves.toEqual({ id: 1, name: "Ring" });
  });

  it("sets an EX TTL rounded up to whole seconds", async () => {
    const cache = createRedisCache(60_000, "products");
    await cache.set("p1", 1);
    expect(mockRedis.setCalls[0]).toMatchObject({
      key: "products:p1",
      mode: "EX",
      ttl: 60,
    });
  });

  it("uses a minimum TTL of 1 second", async () => {
    const cache = createRedisCache(250, "products");
    await cache.set("p1", 1);
    expect(mockRedis.setCalls[0].ttl).toBe(1);
  });

  it("keeps namespaces isolated from each other", async () => {
    const products = createRedisCache(30_000, "products");
    const categories = createRedisCache(30_000, "categories");
    await products.set("k", "product-value");
    await expect(categories.get("k")).resolves.toBeNull();
    await expect(products.get("k")).resolves.toBe("product-value");
  });

  it("clear() deletes only keys matching the namespace prefix", async () => {
    const cache = createRedisCache(30_000, "products");
    mockRedis.store.set("products:a", "1");
    mockRedis.store.set("products:b", "2");
    mockRedis.store.set("order:o1", "{}");
    mockRedis.store.set("track:o1", "[]");

    await cache.clear();

    expect(mockRedis.store.has("products:a")).toBe(false);
    expect(mockRedis.store.has("products:b")).toBe(false);
    expect(mockRedis.store.has("order:o1")).toBe(true);
    expect(mockRedis.store.has("track:o1")).toBe(true);
  });

  it("clear() drains multi-page SCAN results", async () => {
    const cache = createRedisCache(30_000, "products");
    mockRedis.store.set("products:a", "1");
    mockRedis.store.set("products:b", "2");
    mockRedis.store.set("products:c", "3");
    mockRedis.setScanPages(3);

    await cache.clear();

    expect(mockRedis.store.has("products:a")).toBe(false);
    expect(mockRedis.store.has("products:b")).toBe(false);
    expect(mockRedis.store.has("products:c")).toBe(false);
  });

  it("falls back to memory when Redis get throws", async () => {
    const cache = createRedisCache<string>(30_000, "products");
    mockRedis.setFail("get", true);
    await expect(cache.get("anything")).resolves.toBeNull();
  });

  it("round-trips through the memory fallback when Redis fails", async () => {
    const cache = createRedisCache<number>(30_000, "products");
    // set() falls back to memory when Redis set fails...
    mockRedis.setFail("set", true);
    await expect(cache.set("k", 5)).resolves.toBeUndefined();
    // ...and get() reads that fallback value when Redis get also fails.
    mockRedis.setFail("set", false);
    mockRedis.setFail("get", true);
    await expect(cache.get("k")).resolves.toBe(5);
  });

  it("returns null for corrupt JSON instead of throwing", async () => {
    const cache = createRedisCache(30_000, "products");
    mockRedis.store.set("products:bad", "{not-json");
    await expect(cache.get("bad")).resolves.toBeNull();
  });

  it("clear() swallows Redis scan errors", async () => {
    const cache = createRedisCache(30_000, "products");
    mockRedis.setFail("scan", true);
    await expect(cache.clear()).resolves.toBeUndefined();
  });
});
