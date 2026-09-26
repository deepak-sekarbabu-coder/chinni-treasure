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
vi.mock("@/src/lib/catalogue-cache", () => ({
  invalidateCatalogCaches: vi.fn().mockResolvedValue(undefined),
}));

import { prisma } from "@/src/lib/prisma";
import { Prisma } from "@prisma/client";
import { PUT, DELETE } from "@/app/api/categories/[id]/route";

function knownRequestError(code: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError("db error", {
    code,
    clientVersion: "1.0.0",
  });
}

const existingCategory = {
  id: 1,
  name: "Rings",
  slug: "rings",
  description: "Ring collection",
  displayOrder: 1,
  isActive: true,
};

describe("PUT /api/categories/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates a category", async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue(existingCategory);
    vi.mocked(prisma.category.update).mockResolvedValue({
      ...existingCategory,
      name: "Updated Rings",
    });

    const res = await PUT(
      createNextRequest("/api/categories/1", {
        method: "PUT",
        body: { name: "Updated Rings", isActive: false },
      }),
      { params: Promise.resolve({ id: "1" }) },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("Updated Rings");
    expect(prisma.category.update).toHaveBeenCalled();
  });

  it("returns 404 when category missing (P2025)", async () => {
    vi.mocked(prisma.category.update).mockRejectedValue(knownRequestError("P2025"));

    const res = await PUT(
      createNextRequest("/api/categories/999", {
        method: "PUT",
        body: { name: "X" },
      }),
      { params: Promise.resolve({ id: "999" }) },
    );
    expect(res.status).toBe(404);
  });

  it("keeps the category's own slug when it already exists (no -2 suffix)", async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue(existingCategory);
    vi.mocked(prisma.category.update).mockResolvedValue(existingCategory);

    const res = await PUT(
      createNextRequest("/api/categories/1", {
        method: "PUT",
        body: { slug: "rings" },
      }),
      { params: Promise.resolve({ id: "1" }) },
    );
    expect(res.status).toBe(200);
    expect(prisma.category.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ slug: "rings" }) }),
    );
  });

  it("returns 401 when not authenticated", async () => {
    const { checkAuth } = await import("@/src/lib/auth");
    vi.mocked(checkAuth).mockResolvedValueOnce(null);

    const res = await PUT(
      createNextRequest("/api/categories/1", {
        method: "PUT",
        body: { name: "X" },
      }),
      { params: Promise.resolve({ id: "1" }) },
    );
    expect(res.status).toBe(401);
  });
});

describe("DELETE /api/categories/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks deletion when active products exist (409)", async () => {
    vi.mocked(prisma.product.count).mockResolvedValue(3);

    const res = await DELETE(
      createNextRequest("/api/categories/1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "1" }) },
    );
    expect(res.status).toBe(409);
    expect(prisma.category.delete).not.toHaveBeenCalled();
  });

  it("deletes when no active products (200)", async () => {
    vi.mocked(prisma.product.count).mockResolvedValue(0);
    vi.mocked(prisma.category.delete).mockResolvedValue(existingCategory as never);

    const res = await DELETE(
      createNextRequest("/api/categories/1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "1" }) },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(prisma.category.delete).toHaveBeenCalled();
  });

  it("returns 401 when not authenticated", async () => {
    const { checkAuth } = await import("@/src/lib/auth");
    vi.mocked(checkAuth).mockResolvedValueOnce(null);

    const res = await DELETE(
      createNextRequest("/api/categories/1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "1" }) },
    );
    expect(res.status).toBe(401);
  });
});
