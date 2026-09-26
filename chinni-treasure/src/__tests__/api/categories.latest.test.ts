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
import { GET } from "@/app/api/categories/latest/route";

const eligibleProduct = {
  id: "p1",
  name: "New Ring",
  price: 50,
  compareAtPrice: null,
  imageUrl: "/r.jpg",
  description: "Shiny",
  stockQuantity: 5,
  badge: null,
  images: [],
};

describe("GET /api/categories/latest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns one latest eligible product per active category", async () => {
    vi.mocked(prisma.category.findMany).mockResolvedValue([
      {
        id: 1,
        name: "Rings",
        slug: "rings",
        products: [eligibleProduct],
      },
      {
        id: 2,
        name: "Necklaces",
        slug: "necklaces",
        products: [], // no eligible product -> omitted
      },
    ]);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(1);
    expect(body[0].category.slug).toBe("rings");
    expect(body[0].product.id).toBe("p1");
  });

  it("omits categories that have no eligible product (empty products array)", async () => {
    // The DB `where` filters out-of-stock/inactive products; the route then
    // drops any category whose nested products array is empty.
    vi.mocked(prisma.category.findMany).mockResolvedValue([
      {
        id: 1,
        name: "Rings",
        slug: "rings",
        products: [],
      },
    ]);

    const res = await GET();
    const body = await res.json();
    expect(body).toHaveLength(0);
  });

  it("returns 500 on prisma failure", async () => {
    vi.mocked(prisma.category.findMany).mockRejectedValue(new Error("db"));
    const res = await GET();
    expect(res.status).toBe(500);
  });
});
