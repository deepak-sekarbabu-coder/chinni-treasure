import { vi, describe, it, expect, beforeEach } from "vitest";
import { createMockRedis } from "@/src/__tests__/mocks/redis";

// The factory creates the fake instance itself (no top-level variable to
// hoist), and the same cached instance is imported back below for assertions.

vi.mock("@/src/lib/redis", () => ({ redis: createMockRedis() }));

import { redis } from "@/src/lib/redis";
import { revalidateTag } from "next/cache";
import { invalidateCatalogCaches } from "@/src/lib/catalogue-cache";

const mockRedis = redis as unknown as ReturnType<typeof createMockRedis>;

describe("invalidateCatalogCaches", () => {
  beforeEach(() => {
    mockRedis.reset();
    vi.clearAllMocks();
  });

  it("clears every cache owned by the catalogue module", async () => {
    const namespaces = ["products", "catindex", "categories", "catlatest", "catpage"];
    for (const ns of namespaces) {
      mockRedis.store.set(`${ns}:sample`, "{}");
    }
    // Keys outside the catalogue must survive.
    mockRedis.store.set("order:o1", "{}");
    mockRedis.store.set("track:o1", "[]");
    mockRedis.store.set("stats:stats", "{}");

    await invalidateCatalogCaches();

    for (const ns of namespaces) {
      expect(mockRedis.store.has(`${ns}:sample`)).toBe(false);
    }
    expect(mockRedis.store.has("order:o1")).toBe(true);
    expect(mockRedis.store.has("track:o1")).toBe(true);
    expect(mockRedis.store.has("stats:stats")).toBe(true);
  });

  it("revalidates both SSR data-cache tags the catalogue owns", async () => {
    await invalidateCatalogCaches();

    // The category SSR page was tagged `categories` but nothing ever
    // revalidated it — a stale category page survived every mutation.
    expect(revalidateTag).toHaveBeenCalledWith("categories", { expire: 0 });
    expect(revalidateTag).toHaveBeenCalledWith("product-detail", { expire: 0 });
  });

  it("drains multi-page SCAN results per namespace", async () => {
    for (let i = 0; i < 5; i++) {
      mockRedis.store.set(`products:p${i}`, "{}");
    }
    mockRedis.store.set("order:o1", "{}");
    mockRedis.setScanPages(3);

    await invalidateCatalogCaches();

    for (let i = 0; i < 5; i++) {
      expect(mockRedis.store.has(`products:p${i}`)).toBe(false);
    }
    expect(mockRedis.store.has("order:o1")).toBe(true);
  });

  it("resolves without throwing when scan fails", async () => {
    mockRedis.setFail("scan", true);
    await expect(invalidateCatalogCaches()).resolves.toBeUndefined();
  });
});
