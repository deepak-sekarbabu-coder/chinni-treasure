import { vi, describe, it, expect, beforeEach } from "vitest";
import { createMockPrisma } from "@/src/__tests__/mocks/prisma";

vi.mock("@/src/lib/prisma", () => ({ prisma: createMockPrisma() }));
vi.mock("@/src/lib/auth", () => ({
  getSession: vi.fn().mockResolvedValue({ id: "admin-id", username: "admin", role: "admin" }),
  checkAuth: vi.fn().mockResolvedValue({ id: "admin-id", username: "admin", role: "admin" }),
}));

import { prisma } from "@/src/lib/prisma";
import { GET } from "@/app/api/stats/route";

describe("GET /api/stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns stats with counts and revenue", async () => {
    // Mock the raw SQL query result
    vi.mocked(prisma.$queryRaw).mockResolvedValue([
      {
        total_orders: 10n,
        pending_orders: 2n,
        approved_orders: 1n,
        packaging_orders: 1n,
        shipped_orders: 2n,
        delivered_orders: 3n,
        rejected_orders: 1n,
        total_revenue: 5000n,
      },
    ]);
    vi.mocked(prisma.order.findMany).mockResolvedValue([]);
    vi.mocked(prisma.orderItem.groupBy).mockResolvedValue([]);

    const response = await GET();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.stats).toBeDefined();
    expect(body.stats.totalOrders).toBe(10);
    expect(body.stats.totalRevenue).toBe(5000);
    expect(body.chartData).toBeDefined();
    expect(body.productSalesData).toBeDefined();
  });

  it("returns chart data for last 30 days", async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([
      {
        total_orders: 0n,
        pending_orders: 0n,
        approved_orders: 0n,
        packaging_orders: 0n,
        shipped_orders: 0n,
        delivered_orders: 0n,
        rejected_orders: 0n,
        total_revenue: 0n,
      },
    ]);
    vi.mocked(prisma.order.findMany).mockResolvedValue([]);
    vi.mocked(prisma.orderItem.groupBy).mockResolvedValue([]);

    const response = await GET();
    const body = await response.json();

    expect(body.chartData).toHaveLength(30);
  });
});
