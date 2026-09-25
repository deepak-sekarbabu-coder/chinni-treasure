import { vi, describe, it, expect, beforeEach } from "vitest";
import { createMockRedis } from "@/src/__tests__/mocks/redis";
import { createMockPrisma } from "@/src/__tests__/mocks/prisma";

vi.mock("@/src/lib/prisma", () => ({ prisma: createMockPrisma() }));
vi.mock("@/src/lib/redis", () => ({ redis: createMockRedis() }));

import { prisma } from "@/src/lib/prisma";
import { redis } from "@/src/lib/redis";
import { listCatalogue, loadActiveCategories, getProductDetail, listProductsForQuery } from "@/src/lib/product-read";
import { primaryImage } from "@/src/lib/product-display";
import { invalidateCatalogCaches } from "@/src/lib/catalogue-cache";

const mockRedis = redis as unknown as ReturnType<typeof createMockRedis>;

function productRow(over: Record<string, unknown> = {}) {
  return {
    id: "p1",
    name: "Ring",
    price: 100,
    compareAtPrice: null,
    imageUrl: null,
    description: null,
    category: null,
    categoryId: null,
    stockQuantity: 5,
    badge: null,
    sku: null,
    isActive: true,
    allowGiftBoxBundling: false,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: null,
    deletedAt: null,
    images: [],
    ...over,
  };
}

beforeEach(() => {
  mockRedis.reset();
  vi.clearAllMocks();
});

describe("listCatalogue", () => {
  it("fetches once and serves later same host+category calls from cache", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([productRow()] as never);
    vi.mocked(prisma.product.count).mockResolvedValue(1);

    const first = await listCatalogue("example.com", 2);
    const second = await listCatalogue("example.com", 2);
    expect(first.products[0].id).toBe("p1");
    expect(first.total).toBe(1);
    expect(second.products[0].id).toBe("p1");
    expect(prisma.product.findMany).toHaveBeenCalledTimes(1);

    // A different category is its own cache entry.
    await listCatalogue("example.com", 3);
    expect(prisma.product.findMany).toHaveBeenCalledTimes(2);
  });
});

describe("loadActiveCategories", () => {
  it("fetches once and serves the shared `active` key from cache after", async () => {
    vi.mocked(prisma.category.findMany).mockResolvedValue([
      { id: 1, name: "Rings", slug: "rings", displayOrder: 1 },
    ] as never);

    const first = await loadActiveCategories();
    const second = await loadActiveCategories();
    expect(first[0].slug).toBe("rings");
    expect(second).toHaveLength(1);
    expect(prisma.category.findMany).toHaveBeenCalledTimes(1);

    // Same key the public /api/categories reads, and the module's own
    // invalidation empties it for both consumers.
    expect(mockRedis.store.has("categories:active")).toBe(true);
    await invalidateCatalogCaches();
    expect(mockRedis.store.has("categories:active")).toBe(false);
  });
});

describe("getProductDetail", () => {
  it("returns the raw image pieces the display seam resolves once", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(
      productRow({
        description: null,
        images: [
          { id: "i1", url: "/a.jpg", isPrimary: false, displayOrder: 0 },
          { id: "i2", url: "/b.jpg", isPrimary: true, displayOrder: 1 },
        ],
      }) as never,
    );

    const view = await getProductDetail("p1", "example.com");

    expect(view?.price).toBe(100);
    expect(view?.description).toBe("");
    expect(view?.imageUrl).toBe("");
    expect(view?.images).toHaveLength(2);
    // The one picker lives in the display seam — the view feeds it the same
    // pieces the gallery renders from, so no surface re-derives the pick.
    expect(primaryImage(view!)).toBe("/b.jpg");
  });

  it("returns null when the row must not be shown on this surface", async () => {
    const show = async (over: Record<string, unknown>) => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(productRow(over) as never);
      return getProductDetail("p1", "example.com");
    };

    expect(await show({ isActive: false })).toBeNull();
    expect(await show({ deletedAt: new Date() })).toBeNull();
    // Domain visibility is evaluated per request, outside the id-keyed cache.
    expect(await show({ visibleHostnames: "other.test" })).toBeNull();

    vi.mocked(prisma.product.findUnique).mockResolvedValue(null);
    expect(await getProductDetail("missing", "example.com")).toBeNull();
  });
});

describe("listProductsForQuery", () => {
  const adminQuery = {
    page: 1,
    limit: 10,
    skip: 0,
    status: "all" as const,
    search: "",
    badge: "all",
    sort: "newest" as const,
  };

  it("reads Postgres for the admin status filters and caches the page", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([productRow()] as never);
    vi.mocked(prisma.product.count).mockResolvedValue(1);

    const first = await listProductsForQuery("example.com", adminQuery);
    const second = await listProductsForQuery("example.com", adminQuery);

    expect(first.total).toBe(1);
    expect(first.totalPages).toBe(1);
    expect(second.products[0].id).toBe("p1");
    expect(prisma.product.findMany).toHaveBeenCalledTimes(1);

    // The module's own invalidation empties its cache too.
    await invalidateCatalogCaches();
    await listProductsForQuery("example.com", adminQuery);
    expect(prisma.product.findMany).toHaveBeenCalledTimes(2);
  });

  it("narrows to inactive rows for the inactive status", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.product.count).mockResolvedValue(0);

    await listProductsForQuery("example.com", { ...adminQuery, status: "inactive" });

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ isActive: false, deletedAt: null }) }),
    );
  });

  it("serves the active status from the in-memory index", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([productRow()] as never);

    const result = await listProductsForQuery("example.com", { ...adminQuery, status: "active" });

    expect(result.products).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ isActive: true }) }),
    );
  });
});