import { vi, describe, it, expect, beforeEach } from "vitest";
import { createNextRequest } from "@/src/__tests__/utils/api-test";
import { createMockPrisma } from "@/src/__tests__/mocks/prisma";

vi.mock("@/src/lib/prisma", () => ({ prisma: createMockPrisma() }));
vi.mock("@/src/lib/catalogue-cache", () => ({
  invalidateCatalogCaches: vi.fn().mockResolvedValue(undefined),
  CATALOGUE_CACHE_CONTROL: { products: "", categoryPage: "" },
  SORT_OPTIONS: { newest: [{ createdAt: "desc" }] },
  queryCatalogueIndex: vi.fn(),
  catPageCache: {},
  categoriesCache: {},
  giftBoxCache: {},
  productsCache: {},
}));
vi.mock("@/src/lib/auth", () => ({
  getSession: vi.fn().mockResolvedValue({ id: "admin-id", username: "admin", role: "admin" }),
  checkAuth: vi.fn().mockResolvedValue({ id: "admin-id", username: "admin", role: "admin" }),
}));

import { prisma } from "@/src/lib/prisma";
import { PUT, DELETE } from "@/app/api/products/[id]/route";

const params = (id: string) => ({ params: Promise.resolve({ id }) });

describe("/api/products/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.product.findUnique).mockResolvedValue({ sku: "W-1", categoryId: null } as never);
    vi.mocked(prisma.product.update).mockResolvedValue({ id: "p1" } as never);
    vi.mocked(prisma.$transaction).mockResolvedValue([] as never);
  });

  it("soft-deletes by stamping deletedAt", async () => {
    const response = await DELETE(createNextRequest("/api/products/p1", { method: "DELETE" }), await params("p1"));

    expect(response.status).toBe(200);
    expect(prisma.product.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "p1" }, data: { deletedAt: expect.any(Date) } }),
    );
  });

  it("updates through the write module and returns the row", async () => {
    const response = await PUT(
      createNextRequest("/api/products/p1", { method: "PUT", body: { name: "Wallet", price: 500 } }),
      await params("p1"),
    );

    expect(response.status).toBe(200);
    expect(prisma.product.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "p1" }, data: expect.objectContaining({ name: "Wallet" }) }),
    );
  });

  it("rejects an invalid payload with 400", async () => {
    // price must be positive — proves `parseBody` + validateOr400 are wired.
    const response = await PUT(
      createNextRequest("/api/products/p1", { method: "PUT", body: { name: "Wallet", price: -5 } }),
      await params("p1"),
    );

    expect(response.status).toBe(400);
  });
});
