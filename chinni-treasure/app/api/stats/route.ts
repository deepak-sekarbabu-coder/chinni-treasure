import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { checkAuth } from "@/src/lib/auth";
import { createCache } from "@/src/lib/cache";
import { Prisma } from "@prisma/client";

const { get: getCached, set: setCache } = createCache(30_000);

/**
 * Retry a Prisma query when Nhost's pooler returns query_wait_timeout.
 * Uses exponential backoff to avoid hammering the pooler.
 */
async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isPoolTimeout =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2010" &&
        (error.message as string).includes("query_wait_timeout");

      if (isPoolTimeout && attempt < retries) {
        // Exponential backoff: 200ms, 400ms
        await new Promise((r) => setTimeout(r, 200 * Math.pow(2, attempt)));
        continue;
      }
      throw error;
    }
  }
}

// GET /api/stats — Dashboard statistics (admin only)
export async function GET() {
  const admin = await checkAuth();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cached = getCached("stats");
  if (cached) {
    return NextResponse.json(cached, {
      headers: { "Cache-Control": "private, max-age=30" },
    });
  }

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Retry the fetch block on Nhost pooler query_wait_timeout.
    // Since queries are sequential, only 1 connection is used at a time,
    // but the pooler may be temporarily saturated by other requests.
    type StatsRow = {
      total_orders: bigint;
      pending_orders: bigint;
      approved_orders: bigint;
      packaging_orders: bigint;
      shipped_orders: bigint;
      delivered_orders: bigint;
      rejected_orders: bigint;
      total_revenue: bigint | null;
    };

    const { raw, recentOrders, salesByProduct } = await withRetry(async () => {
      const [raw] = await prisma.$queryRaw<StatsRow[]>`
        SELECT
          (SELECT COUNT(*) FROM orders) AS total_orders,
          (SELECT COUNT(*) FROM orders WHERE status = 'pending') AS pending_orders,
          (SELECT COUNT(*) FROM orders WHERE status = 'approved') AS approved_orders,
          (SELECT COUNT(*) FROM orders WHERE status = 'packaging') AS packaging_orders,
          (SELECT COUNT(*) FROM orders WHERE status = 'shipped') AS shipped_orders,
          (SELECT COUNT(*) FROM orders WHERE status = 'delivered') AS delivered_orders,
          (SELECT COUNT(*) FROM orders WHERE status = 'rejected') AS rejected_orders,
          (SELECT COALESCE(SUM(total_amount), 0) FROM orders) AS total_revenue
      `;

      // Recent orders for chart data (last 30 days)
      const recentOrders = await prisma.order.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { totalAmount: true, createdAt: true },
      });

      // Product sales data
      const salesByProduct = await prisma.orderItem.groupBy({
        by: ["productName"],
        _sum: { quantity: true, unitPrice: true },
        _count: true,
        orderBy: { _sum: { unitPrice: "desc" } },
      });

      return { raw, recentOrders, salesByProduct };
    });

    // ---- Stats ----
    const stats = {
      totalOrders: Number(raw.total_orders),
      pendingOrders: Number(raw.pending_orders),
      approvedOrders: Number(raw.approved_orders),
      packagingOrders: Number(raw.packaging_orders),
      shippedOrders: Number(raw.shipped_orders),
      deliveredOrders: Number(raw.delivered_orders),
      rejectedOrders: Number(raw.rejected_orders),
      totalRevenue: Number(raw.total_revenue ?? 0),
    };

    // ---- Chart data: last 30 days ----
    const chartDataMap: Record<string, { orders: number; revenue: number }> = {};

    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
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

    // ---- Product sales (aggregated by SQL) ----
    const productSalesData = salesByProduct.map((item) => ({
      productName: item.productName,
      quantity: item._sum.quantity ?? 0,
      revenue: Number(item._sum.unitPrice ?? 0),
    }));

    const payload = { stats, chartData, productSalesData };

    setCache("stats", payload);

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "private, max-age=30" },
    });
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
