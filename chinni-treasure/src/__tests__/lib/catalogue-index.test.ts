import { vi, describe, it, expect, beforeEach } from "vitest";
import { createMockRedis } from "@/src/__tests__/mocks/redis";
import { createMockPrisma } from "@/src/__tests__/mocks/prisma";

vi.mock("@/src/lib/prisma", () => ({ prisma: createMockPrisma() }));
vi.mock("@/src/lib/redis", () => ({ redis: createMockRedis() }));

import { prisma } from "@/src/lib/prisma";
import { redis } from "@/src/lib/redis";
import { queryCatalogueIndex, SORT_OPTIONS } from "@/src/lib/catalogue-cache";

const mockRedis = redis as unknown as ReturnType<typeof createMockRedis>;

function row(over: Record<string, unknown> = {}) {
  return {
    id: "p-1",
    name: "Product",
    price: 100,
    sku: "SKU-1",
    stockQuantity: 5,
    categoryId: 1,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    category: { name: "Cat" },
    images: [],
    ...over,
  };
}

describe("queryCatalogueIndex", () => {
  beforeEach(() => {
    mockRedis.reset();
    vi.clearAllMocks();
  });

  it("filters the index by search, sku, category, and badge from one cache load", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([
      row({ id: "r1", name: "Rose Gold Ring", sku: "RG-001", categoryId: 2, badge: "bestseller" }),
      row({ id: "r2", name: "Silver Ring", sku: "RG-002", categoryId: 2, badge: null }),
      row({ id: "r3", name: "Gold Bangle", sku: "GB-001", categoryId: 3, badge: "premium" }),
    ] as never);

    const ids = async (q: Record<string, unknown>) =>
      (await queryCatalogueIndex(null, { skip: 0, limit: 10, ...q })).products.map((p) => p.id).sort();

    expect((await queryCatalogueIndex(null, { search: "ring", skip: 0, limit: 10 })).total).toBe(2);
    expect(await ids({ search: "gb-001" })).toEqual(["r3"]);
    expect(await ids({ categoryId: 3 })).toEqual(["r3"]);
    expect(await ids({ badge: "premium" })).toEqual(["r3"]);
    expect(await ids({ badge: "all" })).toEqual(["r1", "r2", "r3"]);
    expect(prisma.product.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ isActive: true, deletedAt: null }) }),
    );
  });

  it("sorts by stockQuantity first, the chosen field next, nulls last, id desc on ties", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([
      row({ id: "p-low", name: "b", sku: null, price: 99, stockQuantity: 1 }),
      row({ id: "p-high-a", name: "z", sku: "A-1", price: 10, stockQuantity: 9 }),
      row({ id: "p-high-b", name: "a", sku: null, price: 20, stockQuantity: 9 }),
    ] as never);

    const ids = async (sort?: string) =>
      (await queryCatalogueIndex(null, { skip: 0, limit: 10, ...(sort ? { sort } : {}) })).products.map(
        (p) => p.id,
      );

    expect(await ids("price-asc")).toEqual(["p-high-a", "p-high-b", "p-low"]);
    expect(await ids("name-asc")).toEqual(["p-high-b", "p-high-a", "p-low"]);
    expect(await ids("sku-asc")).toEqual(["p-high-a", "p-high-b", "p-low"]);
    expect(await ids("sku-desc")).toEqual(["p-high-a", "p-high-b", "p-low"]);
    // Unknown keys fall back to newest ordering (id desc within equal stock).
    expect(await ids("bogus")).toEqual(["p-high-b", "p-high-a", "p-low"]);
  });

  it("pages the filtered results and reports the full total", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue(
      [
        { id: "p6" },
        { id: "p5" },
        { id: "p4" },
        { id: "p3" },
        { id: "p2" },
        { id: "p1" },
      ].map((o) => row(o)) as never,
    );

    const { products, total } = await queryCatalogueIndex(null, { search: "p", skip: 2, limit: 2 });
    expect(total).toBe(6);
    // Equal createdAt + equal stock → newest tie-break is id desc.
    expect(products.map((p) => p.id)).toEqual(["p4", "p3"]);
    expect(prisma.product.findMany).toHaveBeenCalledTimes(1);
  });

  it("accepts every key in the shared sort vocabulary without crashing", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([
      row({ id: "r1", name: "a", price: 1, stockQuantity: 1 }),
      row({ id: "r2", name: "b", price: 2, stockQuantity: 1 }),
    ] as never);

    for (const key of Object.keys(SORT_OPTIONS)) {
      const { products, total } = await queryCatalogueIndex(null, { sort: key, skip: 0, limit: 10 });
      expect(total).toBe(2);
      expect(products.length).toBe(2);
    }
  });

  it("declares every sort key as in-stock-first with an id-desc tiebreak", () => {
    for (const entries of Object.values(SORT_OPTIONS)) {
      expect(entries[0]).toEqual({ stockQuantity: "desc" });
      expect(entries[entries.length - 1]).toEqual({ id: "desc" });
    }
  });
});