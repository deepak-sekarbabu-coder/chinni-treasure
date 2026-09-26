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
vi.mock("@/src/lib/rate-limiter", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 10 }),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
}));

import { prisma } from "@/src/lib/prisma";
import { GET } from "@/app/api/track/route";

const mockOrder = {
  id: "order-uuid",
  orderNumber: "ORD-ABCD",
  customerName: "Test User",
  customerEmail: "test@test.com",
  customerPhone: "9999999999",
  status: "shipped",
  trackingId: "TRACK123",
  totalAmount: 300,
  subtotal: 300,
  shippingCost: 0,
  createdAt: new Date(),
  transactionId: "TXN001",
  customerNotes: null,
  addressLine1: "123 Main St",
  addressLine2: null,
  city: "Mumbai",
  stateCode: "MH",
  postalCode: "400001",
  countryCode: "IN",
  items: [
    { id: "item-1", productName: "Product 1", unitPrice: 100, quantity: 2, orderId: "order-uuid", productId: "p1", parentOrderItemId: null, createdAt: new Date() },
    { id: "item-2", productName: "Product 2", unitPrice: 100, quantity: 1, orderId: "order-uuid", productId: "p2", parentOrderItemId: "item-1", createdAt: new Date() },
  ],
  statusHistory: [
    { id: "h1", orderId: "order-uuid", status: "pending", notes: "Order placed", createdAt: new Date("2026-01-01T00:00:00.000Z") },
    { id: "h2", orderId: "order-uuid", status: "shipped", notes: null, createdAt: new Date("2026-01-03T00:00:00.000Z") },
  ],
};

describe("GET /api/track", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("searches by orderId", async () => {
    vi.mocked(prisma.order.findMany).mockResolvedValue([mockOrder]);

    const req = createNextRequest("/api/track?orderId=ORD-ABCD");
    const response = await GET(req);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toHaveLength(1);
    expect(body[0].orderNumber).toBe("ORD-ABCD");
    expect(body[0].itemCount).toBe(3);
  });

  it("searches by phone", async () => {
    vi.mocked(prisma.order.findMany).mockResolvedValue([mockOrder]);

    const req = createNextRequest("/api/track?phone=9999999999");
    const response = await GET(req);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toHaveLength(1);
  });

  it("returns the money fields the shared order modal renders", async () => {
    vi.mocked(prisma.order.findMany).mockResolvedValue([mockOrder]);

    const req = createNextRequest("/api/track?orderId=ORD-ABCD");
    const body = await (await GET(req)).json();

    // Regression: the tracking projection dropped these, so the shared modal
    // rendered ₹NaN on this surface.
    expect(body[0].subtotal).toBe(300);
    expect(body[0].shippingCost).toBe(0);
    expect(body[0].totalAmount).toBe(300);
  });

  it("keeps the gift-box parent link so order lines nest", async () => {
    vi.mocked(prisma.order.findMany).mockResolvedValue([mockOrder]);

    const req = createNextRequest("/api/track?orderId=ORD-ABCD");
    const body = await (await GET(req)).json();

    expect(body[0].items[1].parentOrderItemId).toBe("item-1");
  });

  it("returns the persisted status history without admin notes", async () => {
    vi.mocked(prisma.order.findMany).mockResolvedValue([mockOrder]);

    const req = createNextRequest("/api/track?orderId=ORD-ABCD");
    const body = await (await GET(req)).json();

    expect(body[0].statusHistory).toEqual([
      { status: "pending", at: "2026-01-01T00:00:00.000Z" },
      { status: "shipped", at: "2026-01-03T00:00:00.000Z" },
    ]);
  });

  it("returns 400 when no params provided", async () => {
    const req = createNextRequest("/api/track");
    const response = await GET(req);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toContain("Provide orderId or phone");
  });

  it("returns empty array when no matches", async () => {
    vi.mocked(prisma.order.findMany).mockResolvedValue([]);

    const req = createNextRequest("/api/track?orderId=NONEXISTENT");
    const response = await GET(req);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toEqual([]);
  });

  it("includes Cache-Control header", async () => {
    vi.mocked(prisma.order.findMany).mockResolvedValue([mockOrder]);

    const req = createNextRequest("/api/track?orderId=ORD-ABCD");
    const response = await GET(req);
    const cacheControl = response.headers.get("Cache-Control");
    expect(cacheControl).toContain("s-maxage=15");
  });
});
