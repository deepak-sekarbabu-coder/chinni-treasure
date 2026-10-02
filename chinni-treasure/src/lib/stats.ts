import { prisma } from "@/src/lib/prisma";
import { ORDER_STATUS_ALL } from "@/src/lib/constants";

const DAY_MS = 24 * 60 * 60 * 1000;
const STATS_WINDOW_DAYS = 30;

export type DashboardStats = {
  stats: {
    totalOrders: number;
    pendingOrders: number;
    approvedOrders: number;
    packagingOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    rejectedOrders: number;
    totalRevenue: number;
  };
  chartData: { date: string; orders: number; revenue: number }[];
  productSalesData: { productName: string; quantity: number; revenue: number }[];
};

/** `pendingOrders` etc. — one field per status, named after the status. */
const statusField = (status: string) =>
  `${status}Orders` as keyof DashboardStats["stats"];

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

  const [byStatus, totals, recentOrders, salesByProduct] = await Promise.all([
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
    prisma.orderItem.groupBy({
      by: ["productName"],
      _sum: { quantity: true, unitPrice: true },
      _count: true,
      orderBy: { _sum: { unitPrice: "desc" } },
    }),
  ]);

  // Every status in the vocabulary gets a field, so a status can never be
  // computed-but-unreachable the way packaging and rejected were.
  const counts: Record<string, number> = {};
  for (const row of byStatus) counts[row.status] = row._count._all;

  const stats = {
    totalOrders: totals._count._all,
    totalRevenue: Number(totals._sum.totalAmount ?? 0),
    ...Object.fromEntries(
      ORDER_STATUS_ALL.map((status) => [statusField(status), counts[status] ?? 0]),
    ),
  } as DashboardStats["stats"];

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

  const productSalesData = salesByProduct.map((item) => ({
    productName: item.productName,
    quantity: item._sum.quantity ?? 0,
    revenue: Number(item._sum.unitPrice ?? 0),
  }));

  return { stats, chartData, productSalesData };
}