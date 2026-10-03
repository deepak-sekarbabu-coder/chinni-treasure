import { vi, describe, it, expect, beforeEach } from "vitest";
import { createNextRequest } from "@/src/__tests__/utils/api-test";
import { createMockPrisma } from "@/src/__tests__/mocks/prisma";

vi.mock("@/src/lib/prisma", () => ({ prisma: createMockPrisma() }));
vi.mock("@/src/lib/catalogue-cache", () => ({
  invalidateCatalogCaches: vi.fn().mockResolvedValue(undefined),
  CATALOGUE_CACHE_CONTROL: { giftBoxes: "public, s-maxage=60" },
  SORT_OPTIONS: { newest: [{ createdAt: "desc" }] },
  queryCatalogueIndex: vi.fn(),
  catPageCache: {},
  categoriesCache: {},
  giftBoxCache: { get: vi.fn().mockResolvedValue(null), set: vi.fn().mockResolvedValue(undefined) },
  productsCache: {},
}));

import { prisma } from "@/src/lib/prisma";
import { GET } from "@/app/api/gift-boxes/route";

describe("GET /api/gift-boxes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("answers the active gift boxes with a public cache header", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([
      { id: "b1", name: "Box", price: 99, imageUrl: null, stockQuantity: 5, images: [{ url: "/box.jpg" }] },
    ] as never);

    const response = await GET(createNextRequest("/api/gift-boxes"));
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toContain("public");

    const body = await response.json();
    expect(body).toEqual([
      { id: "b1", name: "Box", price: 99, imageUrl: "/box.jpg", stockQuantity: 5 },
    ]);
  });

  // The list's own filter is the load-bearing part: only the `box` category,
  // in stock, not deleted. A dropped predicate ships inactive boxes to the
  // storefront, which is the bug this adapter's `withPublic` wrapper exists
  // to make visible.
  it("filters to the gift-box category, in stock and not deleted", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([] as never);

    await GET(createNextRequest("/api/gift-boxes"));

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isActive: true,
          deletedAt: null,
          stockQuantity: { gt: 0 },
          category: { slug: "box" },
        }),
      }),
    );
  });

  it("answers an empty list rather than failing when there are no gift boxes", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([] as never);

    const response = await GET(createNextRequest("/api/gift-boxes"));
    expect(await response.json()).toEqual([]);
  });
});
