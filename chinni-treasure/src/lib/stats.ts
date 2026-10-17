import { prisma } from "@/src/lib/prisma";
import { ORDER_STATUS_ALL } from "@/src/lib/constants";
import type { StatsResponse } from "@/src/lib/api/schemas";

const DAY_MS = 24 * 60 * 60 * 1000;
const STATS_WINDOW_DAYS = 30;

/**
 * The dashboard shape is the API contract, not a second declaration of it:
 * `StatsResponseSchema` derives its per-status fields from `ORDER_STATUS_ALL`,
 * so adding a status here cannot produce a field the schema would strip.
 */
export type DashboardStats = StatsResponse;

type StatusCounts = DashboardStats["stats"];

/** `pendingOrders` etc. — one field per status, named after the status. */
const statusField = (status: string) =>
  `${status}Orders` as keyof StatusCounts;

/**
 * Dashboard statistics: per-status counts, window math, 30-day chart
 * bucketing and product-sales reshaping. The stats route only owns the cache
 * boundary; the computation lives here.
 *
 * The per-status counts come from ONE grouped query, keyed off
 * `ORDER_STATUS_ALL`, rather than a subquery per status. The seven SQL
 * literals this replaces restated the Fulfilment vocabulary in a second place,
 * so adding a status silently left it out of the dashboard.
 */
export async function computeDashboardStats(): Promise<DashboardStats> {
  const now = Date.now();
  const thirtyDaysAgo = new Date(now - STATS_WINDOW_DAYS * DAY_MS);

  const [byStatus, totals, recentOrders, itemLines] = await Promise.all([
    prisma.order.groupBy({
      by: ["status"],
      _count: { _all: true },
      _sum: { totalAmount: true },
    }),
    prisma.order.aggregate({
      _count: { _all: true },
      _sum: { totalAmount: true },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { totalAmount: true, createdAt: true },
    }),
    prisma.orderItem.findMany({
      select: { productName: true, unitPrice: true, quantity: true },
    }),
  ]);

  // Every status in the vocabulary gets a field, so a status can never be
  // computed-but-unreachable the way packaging and rejected were.
  const counts: Record<string, number> = {};
  for (const row of byStatus) counts[row.status] = row._count._all;

  const stats: StatusCounts = {
    totalOrders: totals._count._all,
    totalRevenue: Number(totals._sum.totalAmount ?? 0),
    ...Object.fromEntries(
      ORDER_STATUS_ALL.map((status) => [statusField(status), counts[status] ?? 0]),
    ),
  } as StatusCounts;

  // Chart data: last 30 days
  const chartDataMap: Record<string, { orders: number; revenue: number }> = {};

  for (let i = STATS_WINDOW_DAYS - 1; i >= 0; i--) {
    const d = new Date(now - i * DAY_MS);
    const key = d.toISOString().split("T")[0];
    chartDataMap[key] = { orders: 0, revenue: 0 };
  }

  for (const o of recentOrders) {
    const key = new Date(o.createdAt).toISOString().split("T")[0];
    if (chartDataMap[key]) {
      chartDataMap[key].orders += 1;
      chartDataMap[key].revenue += Number(o.totalAmount);
    }
  }

  const chartData = Object.entries(chartDataMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({ date, ...data }));

  // Revenue is money taken, so each line weighs in by quantity. The grouped
  // `_sum.unitPrice` this replaces added a product's price once per order line
  // (and ranked on that figure), so a ₹100 item sold 3× beat a ₹250 item sold
  // once. Top Products renders the first 10 rows, so the ranking matters.
  const salesByProduct = new Map<string, { quantity: number; revenue: number }>();
  for (const line of itemLines) {
    const sales = salesByProduct.get(line.productName) ?? { quantity: 0, revenue: 0 };
    sales.quantity += line.quantity;
    sales.revenue += Number(line.unitPrice) * line.quantity;
    salesByProduct.set(line.productName, sales);
  }

  const productSalesData = [...salesByProduct]
    .map(([productName, sales]) => ({ productName, ...sales }))
    .sort((a, b) => b.revenue - a.revenue);

  return { stats, chartData, productSalesData };
}