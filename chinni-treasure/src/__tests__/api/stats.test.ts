import { vi, describe, it, expect, beforeEach } from "vitest";
import { createMockPrisma } from "@/src/__tests__/mocks/prisma";
import { createNextRequest } from "@/src/__tests__/utils/api-test";

vi.mock("@/src/lib/prisma", () => ({ prisma: createMockPrisma() }));
vi.mock("@/src/lib/redis-cache", () => ({
  createRedisCache: () => ({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
  }),
}));
vi.mock("@/src/lib/auth", () => ({
  getSession: vi.fn().mockResolvedValue({ id: "admin-id", username: "admin", role: "admin" }),
  checkAuth: vi.fn().mockResolvedValue({ id: "admin-id", username: "admin", role: "admin" }),
}));

import { prisma } from "@/src/lib/prisma";
import { ORDER_STATUS_ALL } from "@/src/lib/constants";
import { GET } from "@/app/api/stats/route";

describe("GET /api/stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns stats with counts and revenue", async () => {
    // The stats module reads per-status counts from one grouped query, keyed
    // off ORDER_STATUS_ALL — no raw SQL.
    vi.mocked(prisma.order.groupBy).mockResolvedValue([
      { status: "pending", _count: { _all: 2 }, _sum: { totalAmount: 1000 } },
      { status: "approved", _count: { _all: 1 }, _sum: { totalAmount: 500 } },
      { status: "packaging", _count: { _all: 1 }, _sum: { totalAmount: 500 } },
      { status: "shipped", _count: { _all: 2 }, _sum: { totalAmount: 1500 } },
      { status: "delivered", _count: { _all: 3 }, _sum: { totalAmount: 1500 } },
      { status: "rejected", _count: { _all: 1 }, _sum: { totalAmount: 0 } },
    ] as never);
    vi.mocked(prisma.order.aggregate).mockResolvedValue({
      _count: { _all: 10 },
      _sum: { totalAmount: 5000 },
    } as never);
    vi.mocked(prisma.order.findMany).mockResolvedValue([]);
    vi.mocked(prisma.orderItem.groupBy).mockResolvedValue([]);

    const response = await GET(createNextRequest("/api/stats"));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.stats.totalOrders).toBe(10);
    expect(body.stats.totalRevenue).toBe(5000);
    expect(body.stats.pendingOrders).toBe(2);
    expect(body.stats.deliveredOrders).toBe(3);
    expect(body.chartData).toBeDefined();
    expect(body.productSalesData).toBeDefined();
  });

  it("reports zero for a status with no orders rather than omitting it", async () => {
    vi.mocked(prisma.order.groupBy).mockResolvedValue([
      { status: "pending", _count: { _all: 1 }, _sum: { totalAmount: 100 } },
    ] as never);
    vi.mocked(prisma.order.aggregate).mockResolvedValue({
      _count: { _all: 1 },
      _sum: { totalAmount: 100 },
    } as never);
    vi.mocked(prisma.order.findMany).mockResolvedValue([]);
    vi.mocked(prisma.orderItem.groupBy).mockResolvedValue([]);

    const body = await (await GET(createNextRequest("/api/stats"))).json();

    // Every status in ORDER_STATUS_ALL is present, so the dashboard can
    // render one it has no rows for.
    for (const status of ORDER_STATUS_ALL) {
      expect(body.stats).toHaveProperty(`${status}Orders`);
    }
    expect(body.stats.shippedOrders).toBe(0);
  });

  it("returns chart data for last 30 days", async () => {
    vi.mocked(prisma.order.groupBy).mockResolvedValue([] as never);
    vi.mocked(prisma.order.aggregate).mockResolvedValue({
      _count: { _all: 0 },
      _sum: { totalAmount: 0 },
    } as never);
    vi.mocked(prisma.order.findMany).mockResolvedValue([]);
    vi.mocked(prisma.orderItem.groupBy).mockResolvedValue([]);

    const response = await GET(createNextRequest("/api/stats"));
    const body = await response.json();

    expect(body.chartData).toHaveLength(30);
  });
});
