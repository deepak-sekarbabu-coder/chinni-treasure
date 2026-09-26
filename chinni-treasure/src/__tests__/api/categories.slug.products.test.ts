import { vi, describe, it, expect, beforeEach } from "vitest";
import { createMockPrisma } from "@/src/__tests__/mocks/prisma";

vi.mock("@/src/lib/prisma", () => ({ prisma: createMockPrisma() }));
vi.mock("@/src/lib/redis-cache", () => ({
  createRedisCache: () => ({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
  }),
}));

import { prisma } from "@/src/lib/prisma";
import { GET } from "@/app/api/category/[slug]/products/route";

const mockCategory = {
  id: 1,
  name: "Rings",
  slug: "rings",
  description: "All rings",
  isActive: true,
};

const mockProduct = {
  id: "p1",
  name: "Gold Ring",
  price: 100,
  compareAtPrice: null,
  imageUrl: "/g.jpg",
  description: "Pretty",
  stockQuantity: 3,
  badge: null,
  category: { name: "Rings" },
  categoryId: 1,
  sku: "R-1",
  isActive: true,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-02T00:00:00Z"),
  images: [],
};

describe("GET /api/category/[slug]/products", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns paginated active products for a category", async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory);
    vi.mocked(prisma.product.findMany).mockResolvedValue([mockProduct]);
    vi.mocked(prisma.product.count).mockResolvedValue(1);

    const res = await GET(
      new Request("https://example.com/api/category/rings/products?page=1&limit=12"),
      { params: Promise.resolve({ slug: "rings" }) },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.category.slug).toBe("rings");
    expect(body.products).toHaveLength(1);
    expect(body.total).toBe(1);
    expect(body.page).toBe(1);
  });

  it("returns 404 for unknown category", async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue(null);
    const res = await GET(
      new Request("https://example.com/api/category/nope/products"),
      { params: Promise.resolve({ slug: "nope" }) },
    );
    expect(res.status).toBe(404);
  });

  it("returns 404 for inactive category", async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue({
      ...mockCategory,
      isActive: false,
    });
    const res = await GET(
      new Request("https://example.com/api/category/rings/products"),
      { params: Promise.resolve({ slug: "rings" }) },
    );
    expect(res.status).toBe(404);
  });

  it("supports price-asc sorting", async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory);
    vi.mocked(prisma.product.findMany).mockResolvedValue([]);
    vi.mocked(prisma.product.count).mockResolvedValue(0);

    await GET(
      new Request("https://example.com/api/category/rings/products?sort=price-asc"),
      { params: Promise.resolve({ slug: "rings" }) },
    );
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: [{ stockQuantity: "desc" }, { price: "asc" }, { id: "desc" }] }),
    );
  });
});
