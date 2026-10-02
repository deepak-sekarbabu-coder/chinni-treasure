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

const PHONE = "9876543210";

async function resolveParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function order(overrides: Record<string, unknown> = {}) {
  return {
    id: "order-uuid",
    orderNumber: "ORD-TEST",
    customerName: "Test User",
    customerPhone: PHONE,
    status: "pending",
    totalAmount: 300,
    createdAt: new Date(),
    items: [],
    statusHistory: [],
    ...overrides,
  } as never;
}

describe("GET /api/orders/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns order with items and statusHistory for id + matching phone", async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(order());

    const response = await GET(
      createNextRequest(`/api/orders/order-uuid?phone=${PHONE}`),
      await resolveParams("order-uuid"),
    );
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.id).toBe("order-uuid");
    expect(body.items).toBeDefined();
    expect(body.statusHistory).toBeDefined();
  });

  it("404s when the phone does not match, so ids cannot be probed", async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(order());

    const response = await GET(
      createNextRequest("/api/orders/order-uuid?phone=9000000000"),
      await resolveParams("order-uuid"),
    );
    expect(response.status).toBe(404);
    expect((await response.json()).error).toBe("Order not found");
  });

  it("400s without a phone, and never reaches the database", async () => {
    const response = await GET(
      createNextRequest("/api/orders/order-uuid"),
      await resolveParams("order-uuid"),
    );
    expect(response.status).toBe(400);
    expect(prisma.order.findUnique).not.toHaveBeenCalled();
  });

  it("returns 404 when order not found", async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

    const response = await GET(
      createNextRequest(`/api/orders/non-existent?phone=${PHONE}`),
      await resolveParams("non-existent"),
    );
    expect(response.status).toBe(404);

    const body = await response.json();
    expect(body.error).toBe("Order not found");
  });

  it("is never edge-cached: PII keyed by a phone, not a public read", async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(order());

    const response = await GET(
      createNextRequest(`/api/orders/order-uuid?phone=${PHONE}`),
      await resolveParams("order-uuid"),
    );
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });
});
