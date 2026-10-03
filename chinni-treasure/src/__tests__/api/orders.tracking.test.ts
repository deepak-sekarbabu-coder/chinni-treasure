import { vi, describe, it, expect, beforeEach } from "vitest";
import { createNextRequest } from "@/src/__tests__/utils/api-test";
import { createMockPrisma } from "@/src/__tests__/mocks/prisma";

vi.mock("@/src/lib/prisma", () => ({ prisma: createMockPrisma() }));
vi.mock("@/src/lib/order-cache", () => ({
  invalidateOrderCache: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/src/lib/auth", () => ({
  getSession: vi.fn().mockResolvedValue({ id: "admin-id", username: "admin", role: "admin" }),
  checkAuth: vi.fn().mockResolvedValue({ id: "admin-id", username: "admin", role: "admin" }),
}));

import { prisma } from "@/src/lib/prisma";
import { invalidateOrderCache } from "@/src/lib/order-cache";
import { PATCH } from "@/app/api/orders/[id]/tracking/route";

async function resolveParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

const mockOrder = {
  id: "order-uuid",
  orderNumber: "ORD-TEST",
  customerName: "Test User",
  customerEmail: "test@test.com",
  customerPhone: "9999999999",
  status: "packaging",
  version: 0,
  trackingId: null,
  totalAmount: 100,
  subtotal: 100,
  shippingCost: 0,
  createdAt: new Date(),
  items: [],
};

async function patch(id: string, body: unknown) {
  return PATCH(
    createNextRequest(`/api/orders/${id}/tracking`, { method: "PATCH", body }),
    await resolveParams(id),
  );
}

describe("PATCH /api/orders/[id]/tracking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.order.findUnique).mockResolvedValue({ ...mockOrder, statusHistory: [] } as never);
    vi.mocked(prisma.order.update).mockResolvedValue({ ...mockOrder, trackingId: "TRACK1", version: 1, statusHistory: [] } as never);
  });

  it("writes the tracking ID and invalidates the order caches", async () => {
    const response = await patch("order-uuid", { trackingId: "TRACK1", expectedVersion: 0 });

    expect(response.status).toBe(200);
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ trackingId: "TRACK1" }) }),
    );
    expect(invalidateOrderCache).toHaveBeenCalledWith("order-uuid");
  });

  // The tracking adapter is the status adapter's declared twin; a dropped
  // `parseBody` or a lost invalidation here would ship green without this.
  it("returns 404 for a non-existent order", async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(null as never);

    const response = await patch("nonexistent", { trackingId: "TRACK1" });
    expect(response.status).toBe(404);
  });

  it("returns 409 on version mismatch", async () => {
    const response = await patch("order-uuid", { trackingId: "TRACK1", expectedVersion: 99 });
    expect(response.status).toBe(409);
  });

  it("returns 400 for an empty tracking ID", async () => {
    const response = await patch("order-uuid", { trackingId: "" });
    expect(response.status).toBe(400);
  });
});
