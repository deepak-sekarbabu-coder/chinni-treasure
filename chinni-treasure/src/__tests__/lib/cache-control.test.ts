import { describe, it, expect } from "vitest";
import { PUBLIC_TTL, publicCacheControl } from "@/src/lib/cache-control";
import { CATALOGUE_CACHE_CONTROL, productsCache, categoriesCache } from "@/src/lib/catalogue-cache";
import { TRACK_CACHE_CONTROL } from "@/src/lib/order-cache";

describe("public cache control", () => {
  it("derives s-maxage from the TTL and doubles it for swr", () => {
    expect(publicCacheControl(30_000)).toBe("public, s-maxage=30, stale-while-revalidate=60");
    expect(publicCacheControl(300_000)).toBe("public, s-maxage=300, stale-while-revalidate=600");
  });

  it("never emits a sub-second s-maxage", () => {
    expect(publicCacheControl(1)).toContain("s-maxage=1");
  });

  // The whole point: the number a route sends to the edge is the number the
  // owning cache was actually built with, so the two cannot drift.
  it("each route's header derives from its own cache's TTL, not a copy of it", () => {
    expect(CATALOGUE_CACHE_CONTROL.products).toBe(publicCacheControl(productsCache.ttlMs));
    expect(CATALOGUE_CACHE_CONTROL.categories).toBe(publicCacheControl(categoriesCache.ttlMs));
    expect(TRACK_CACHE_CONTROL).toBe(publicCacheControl(PUBLIC_TTL.tracking));
  });
});
