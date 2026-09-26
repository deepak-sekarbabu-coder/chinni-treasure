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
import { Prisma } from "@prisma/client";
import { GET, POST } from "@/app/api/categories/route";

function knownRequestError(code: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError("db error", {
    code,
    clientVersion: "1.0.0",
  });
}

const mockActiveCategory = {
  id: 1,
  name: "Rings",
  slug: "rings",
  displayOrder: 1,
};

const mockInactiveCategory = {
  id: 2,
  name: "Necklaces",
  slug: "necklaces",
  description: "All necklaces",
  displayOrder: 2,
  isActive: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  _count: { products: 5 },
};

describe("GET /api/categories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns only active categories for public (no includeInactive)", async () => {
    vi.mocked(prisma.category.findMany).mockResolvedValue([mockActiveCategory]);

    const res = await GET(createNextRequest("/api/categories"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(1);
    expect(body[0].name).toBe("Rings");
    expect(body[0]).not.toHaveProperty("isActive");
    expect(body[0]).not.toHaveProperty("productCount");
    expect(prisma.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true } }),
    );
  });

  it("returns all categories with productCount for admin (includeInactive=true)", async () => {
    vi.mocked(prisma.category.findMany).mockResolvedValue([
      mockActiveCategory,
      mockInactiveCategory,
    ]);

    const res = await GET(createNextRequest("/api/categories?includeInactive=true"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(2);
    const inactive = body.find((c: { id: number }) => c.id === 2);
    expect(inactive.isActive).toBe(false);
    expect(inactive.productCount).toBe(5);
  });

  it("returns 500 on prisma failure", async () => {
    vi.mocked(prisma.category.findMany).mockRejectedValue(new Error("db down"));
    const res = await GET(createNextRequest("/api/categories"));
    expect(res.status).toBe(500);
  });
});

describe("POST /api/categories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a category with generated slug when slug omitted", async () => {
    const created = {
      id: 3,
      name: "Bracelets",
      slug: "bracelets",
      description: null,
      displayOrder: 0,
      isActive: true,
    };
    vi.mocked(prisma.category.create).mockResolvedValue(created);

    const res = await POST(
      createNextRequest("/api/categories", {
        method: "POST",
        body: { name: "Bracelets" },
      }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.name).toBe("Bracelets");
    expect(body.slug).toBe("bracelets");
    expect(prisma.category.create).toHaveBeenCalled();
  });

  it("rejects when name is missing", async () => {
    const res = await POST(
      createNextRequest("/api/categories", {
        method: "POST",
        body: {},
      }),
    );
    expect(res.status).toBe(400);
  });

  it("suffixes the slug with -2 when the base slug is taken", async () => {
    vi.mocked(prisma.category.findUnique)
      .mockResolvedValueOnce({ id: 1 } as never)
      .mockResolvedValueOnce(null);
    const created = {
      id: 4,
      name: "Rings",
      slug: "rings-2",
      description: null,
      displayOrder: 0,
      isActive: true,
    };
    vi.mocked(prisma.category.create).mockResolvedValue(created);

    const res = await POST(
      createNextRequest("/api/categories", {
        method: "POST",
        body: { name: "Rings" },
      }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.slug).toBe("rings-2");
    expect(prisma.category.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ slug: "rings-2" }) }),
    );
  });

  it("returns 409 on duplicate slug (P2002)", async () => {
    vi.mocked(prisma.category.create).mockRejectedValue(knownRequestError("P2002"));

    const res = await POST(
      createNextRequest("/api/categories", {
        method: "POST",
        body: { name: "Rings", slug: "rings" },
      }),
    );
    expect(res.status).toBe(409);
  });

  it("returns 401 when not authenticated", async () => {
    const { checkAuth } = await import("@/src/lib/auth");
    vi.mocked(checkAuth).mockResolvedValueOnce(null);

    const res = await POST(
      createNextRequest("/api/categories", {
        method: "POST",
        body: { name: "X" },
      }),
    );
    expect(res.status).toBe(401);
  });
});
