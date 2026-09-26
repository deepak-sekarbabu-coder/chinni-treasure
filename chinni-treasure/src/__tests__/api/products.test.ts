import { vi, describe, it, expect, beforeEach } from "vitest";
import { createNextRequest } from "@/src/__tests__/utils/api-test";
import { createMockPrisma } from "@/src/__tests__/mocks/prisma";

vi.mock("@/src/lib/prisma", () => ({ prisma: createMockPrisma() }));
vi.mock("@/src/lib/auth", () => ({
  getSession: vi.fn().mockResolvedValue({ id: "admin-id", username: "admin", role: "admin" }),
  checkAuth: vi.fn().mockResolvedValue({ id: "admin-id", username: "admin", role: "admin" }),
}));
vi.mock("@/src/lib/csrf", () => ({
  validateCsrfOrigin: vi.fn().mockReturnValue(null),
}));
vi.mock("@/src/lib/redis-cache", () => ({
  createRedisCache: () => ({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
  }),
}));

import { prisma } from "@/src/lib/prisma";
import { GET, POST } from "@/app/api/products/route";
import { checkAuth } from "@/src/lib/auth";
import { PUT, DELETE } from "@/app/api/products/[id]/route";

const productRow = {
  id: "p1",
  name: "Wallet",
  price: 500,
  compareAtPrice: null,
  imageUrl: null,
  description: null,
  sku: null,
  badge: null,
  isActive: true,
  stockQuantity: 5,
  categoryId: 2,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("POST /api/products", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a product", async () => {
    vi.mocked(prisma.product.create).mockResolvedValue(productRow as never);

    const res = await POST(
      createNextRequest("/api/products", {
        method: "POST",
        body: { name: "Wallet", price: 500, categoryId: 2 },
      }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.name).toBe("Wallet");
    expect(prisma.product.create).toHaveBeenCalled();
  });

  it("rejects gift box bundling on a Gift Box category product (400)", async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue({ slug: "box" } as never);

    const res = await POST(
      createNextRequest("/api/products", {
        method: "POST",
        body: { name: "Wallet", price: 500, categoryId: 1, allowGiftBoxBundling: true },
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Gift box bundling cannot be enabled");
    expect(prisma.product.create).not.toHaveBeenCalled();
  });

  it("allows gift box bundling on a non-box category product", async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue({ slug: "premium" } as never);
    vi.mocked(prisma.product.create).mockResolvedValue(productRow as never);

    const res = await POST(
      createNextRequest("/api/products", {
        method: "POST",
        body: { name: "Wallet", price: 500, categoryId: 1, allowGiftBoxBundling: true },
      }),
    );
    expect(res.status).toBe(201);
  });

  it("returns 401 when not authenticated", async () => {
    const { checkAuth } = await import("@/src/lib/auth");
    vi.mocked(checkAuth).mockResolvedValueOnce(null);

    const res = await POST(
      createNextRequest("/api/products", {
        method: "POST",
        body: { name: "Wallet", price: 500 },
      }),
    );
    expect(res.status).toBe(401);
  });
});

describe("PUT /api/products/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates a product", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue({
      sku: "SKU-1",
      categoryId: 2,
      allowGiftBoxBundling: false,
    } as never);
    vi.mocked(prisma.product.update).mockResolvedValue({ ...productRow, name: "New Wallet" } as never);

    const res = await PUT(
      createNextRequest("/api/products/p1", {
        method: "PUT",
        body: { name: "New Wallet" },
      }),
      { params: Promise.resolve({ id: "p1" }) },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("New Wallet");
  });

  it("rejects gift box bundling when the product's category is a Gift Box (400)", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue({
      sku: "SKU-1",
      categoryId: 1,
      allowGiftBoxBundling: false,
    } as never);
    vi.mocked(prisma.category.findUnique).mockResolvedValue({ slug: "box" } as never);

    const res = await PUT(
      createNextRequest("/api/products/p1", {
        method: "PUT",
        body: { allowGiftBoxBundling: true },
      }),
      { params: Promise.resolve({ id: "p1" }) },
    );
    expect(res.status).toBe(400);
    expect(prisma.product.update).not.toHaveBeenCalled();
  });

  it("returns 404 when product missing (P2025)", async () => {
    vi.mocked(prisma.product.update).mockRejectedValue(
      new (await import("@prisma/client")).Prisma.PrismaClientKnownRequestError("db error", {
        code: "P2025",
        clientVersion: "1.0.0",
      }),
    );

    const res = await PUT(
      createNextRequest("/api/products/x", {
        method: "PUT",
        body: { name: "X" },
      }),
      { params: Promise.resolve({ id: "x" }) },
    );
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/products/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("soft deletes a product", async () => {
    vi.mocked(prisma.product.update).mockResolvedValue(productRow as never);

    const res = await DELETE(
      createNextRequest("/api/products/p1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "p1" }) },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(prisma.product.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ deletedAt: expect.any(Date) }) }),
    );
  });
});

describe("GET /api/products", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkAuth).mockResolvedValue({ id: "admin-id", username: "admin", role: "admin" });
  });

  it("rejects an anonymous isActive=all listing (401)", async () => {
    vi.mocked(checkAuth).mockResolvedValueOnce(null);

    const res = await GET(createNextRequest("/api/products?isActive=all"));

    expect(res.status).toBe(401);
    expect(prisma.product.findMany).not.toHaveBeenCalled();
  });

  it("serves the admin listing with a session, kept out of the shared edge cache", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([productRow] as never);
    vi.mocked(prisma.product.count).mockResolvedValue(1);

    const res = await GET(createNextRequest("/api/products?isActive=all"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.total).toBe(1);
    expect(body.products[0].id).toBe("p1");
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ deletedAt: null }) }),
    );
  });

  it("returns only inactive products for isActive=inactive", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([productRow] as never);
    vi.mocked(prisma.product.count).mockResolvedValue(1);

    const res = await GET(createNextRequest("/api/products?isActive=inactive"));

    expect(res.status).toBe(200);
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isActive: false, deletedAt: null }),
      }),
    );
  });

  it("serves the public active listing from the in-memory index", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([{ ...productRow, images: [] }] as never);

    const res = await GET(createNextRequest("/api/products"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.products).toHaveLength(1);
    expect(body.totalPages).toBe(1);
    expect(res.headers.get("Cache-Control")).toContain("public");
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ isActive: true }) }),
    );
  });
});
