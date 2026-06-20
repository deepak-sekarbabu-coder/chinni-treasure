import { vi, describe, it, expect, beforeEach } from "vitest";
import { createNextRequest } from "@/src/__tests__/utils/api-test";
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
    vi.mocked(prisma.order.count).mockResolvedValue(10);
    vi.mocked(prisma.order.aggregate).mockResolvedValue({
      _sum: { totalAmount: 5000 },
      _count: undefined as never,
      _avg: undefined as never,
      _max: undefined as never,
      _min: undefined as never,
    });
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
    vi.mocked(prisma.order.count).mockResolvedValue(0);
    vi.mocked(prisma.order.aggregate).mockResolvedValue({
      _sum: { totalAmount: 0 },
      _count: undefined as never,
      _avg: undefined as never,
      _max: undefined as never,
      _min: undefined as never,
    });
    vi.mocked(prisma.order.findMany).mockResolvedValue([]);
    vi.mocked(prisma.orderItem.groupBy).mockResolvedValue([]);

    const response = await GET();
    const body = await response.json();

    expect(body.chartData).toHaveLength(30);
  });
});
