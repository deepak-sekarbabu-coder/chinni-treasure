import { vi, describe, it, expect, beforeEach } from "vitest";
import { createNextRequest } from "@/src/__tests__/utils/api-test";
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
import { GET } from "@/app/api/orders/[id]/route";

async function resolveParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("GET /api/orders/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns order with items and statusHistory", async () => {
    const mockOrder = {
      id: "order-uuid",
      orderNumber: "ORD-TEST",
      customerName: "Test User",
      status: "pending",
      totalAmount: 300,
      createdAt: new Date(),
      items: [],
      statusHistory: [],
    };

    vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder);

    const response = await GET(
      createNextRequest("/api/orders/order-uuid"),
      await resolveParams("order-uuid"),
    );
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.id).toBe("order-uuid");
    expect(body.items).toBeDefined();
    expect(body.statusHistory).toBeDefined();
  });

  it("returns 404 when order not found", async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

    const response = await GET(
      createNextRequest("/api/orders/non-existent"),
      await resolveParams("non-existent"),
    );
    expect(response.status).toBe(404);

    const body = await response.json();
    expect(body.error).toBe("Order not found");
  });

  it("includes Cache-Control header", async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: "order-uuid",
      orderNumber: "ORD-TEST",
      customerName: "Test",
      status: "pending",
      totalAmount: 100,
      createdAt: new Date(),
      items: [],
      statusHistory: [],
    });

    const response = await GET(
      createNextRequest("/api/orders/order-uuid"),
      await resolveParams("order-uuid"),
    );
    const cacheControl = response.headers.get("Cache-Control");
    expect(cacheControl).toContain("s-maxage=30");
  });
});
