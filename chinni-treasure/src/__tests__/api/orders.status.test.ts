import { vi, describe, it, expect, beforeEach } from "vitest";
import { createNextRequest } from "@/src/__tests__/utils/api-test";
import { createMockPrisma, mockTx } from "@/src/__tests__/mocks/prisma";

vi.mock("@/src/lib/prisma", () => ({ prisma: createMockPrisma() }));
vi.mock("@/src/lib/order-cache", () => ({
  invalidateOrderCache: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/src/lib/auth", () => ({
  getSession: vi.fn().mockResolvedValue({ id: "admin-id", username: "admin", role: "admin" }),
  checkAuth: vi.fn().mockResolvedValue({ id: "admin-id", username: "admin", role: "admin" }),
}));

import { prisma } from "@/src/lib/prisma";
import { PATCH } from "@/app/api/orders/[id]/status/route";

async function resolveParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

const mockOrder = {
  id: "order-uuid",
  orderNumber: "ORD-TEST",
  customerName: "Test User",
  customerEmail: "test@test.com",
  customerPhone: "9999999999",
  status: "pending",
  version: 0,
  trackingId: null,
  totalAmount: 100,
  subtotal: 100,
  shippingCost: 0,
  createdAt: new Date(),
  items: [
    { id: "item-1", productId: "p1", quantity: 2, orderId: "order-uuid" },
    { id: "item-2", productId: "p2", quantity: 1, orderId: "order-uuid" },
  ],
};

describe("PATCH /api/orders/[id]/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("advances order status", async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder);
    vi.mocked(prisma.order.update).mockResolvedValue({
      ...mockOrder,
      status: "approved",
      version: 1,
      statusHistory: [],
    });

    const req = createNextRequest("/api/orders/order-uuid/status", {
      method: "PATCH",
      body: { status: "approved" },
    });

    const response = await PATCH(req, await resolveParams("order-uuid"));
    expect(response.status).toBe(200);
  });

  it("returns 404 for non-existent order", async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

    const req = createNextRequest("/api/orders/nonexistent/status", {
      method: "PATCH",
      body: { status: "approved" },
    });

    const response = await PATCH(req, await resolveParams("nonexistent"));
    expect(response.status).toBe(404);
  });

  it("returns 409 on version mismatch", async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder);

    const req = createNextRequest("/api/orders/order-uuid/status", {
      method: "PATCH",
      body: { status: "approved", expectedVersion: 99 },
    });

    const response = await PATCH(req, await resolveParams("order-uuid"));
    expect(response.status).toBe(409);
  });

  it("returns 400 when shipped without trackingId", async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder);

    const req = createNextRequest("/api/orders/order-uuid/status", {
      method: "PATCH",
      body: { status: "shipped" },
    });

    const response = await PATCH(req, await resolveParams("order-uuid"));
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toContain("Tracking ID");
  });

  it("restocks items when rejected", async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder);
    vi.mocked(prisma.$transaction).mockImplementation(
      async (cb: (tx: typeof mockTx) => unknown) => cb(mockTx),
    );

    const req = createNextRequest("/api/orders/order-uuid/status", {
      method: "PATCH",
      body: { status: "rejected" },
    });

    const response = await PATCH(req, await resolveParams("order-uuid"));
    expect(response.status).toBe(200);
  });

  it("accepts status update with valid version", async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder);
    vi.mocked(prisma.order.update).mockResolvedValue({
      ...mockOrder,
      status: "approved",
      version: 1,
      statusHistory: [],
    });

    const req = createNextRequest("/api/orders/order-uuid/status", {
      method: "PATCH",
      body: {
        status: "approved",
        expectedVersion: 0,
        notes: "Verified and approved",
      },
    });

    const response = await PATCH(req, await resolveParams("order-uuid"));
    expect(response.status).toBe(200);
  });

  it("blocks an illegal status jump (pending → shipped)", async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder);

    const req = createNextRequest("/api/orders/order-uuid/status", {
      method: "PATCH",
      body: { status: "shipped", trackingId: "TRACK123", expectedVersion: 0 },
    });

    const response = await PATCH(req, await resolveParams("order-uuid"));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("Cannot move from pending to shipped");
  });

  it("blocks re-opening a rejected order", async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      ...mockOrder,
      status: "rejected",
    });

    const req = createNextRequest("/api/orders/order-uuid/status", {
      method: "PATCH",
      body: { status: "approved" },
    });

    const response = await PATCH(req, await resolveParams("order-uuid"));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("cannot be re-opened");
  });
});
