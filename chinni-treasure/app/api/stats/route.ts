import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { checkAuth } from "@/src/lib/auth";
import { createCache } from "@/src/lib/cache";

const { get: getCached, set: setCache } = createCache(30_000);

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

    const [
      totalOrders,
      pendingOrders,
      approvedOrders,
      packagingOrders,
      shippedOrders,
      deliveredOrders,
      rejectedOrders,
      totalRevenue,
      recentOrders,
      salesByProduct,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: "pending" } }),
      prisma.order.count({ where: { status: "approved" } }),
      prisma.order.count({ where: { status: "packaging" } }),
      prisma.order.count({ where: { status: "shipped" } }),
      prisma.order.count({ where: { status: "delivered" } }),
      prisma.order.count({ where: { status: "rejected" } }),
      prisma.order.aggregate({ _sum: { totalAmount: true } }),
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

    // ---- Stats ----
    const stats = {
      totalOrders,
      pendingOrders,
      approvedOrders,
      packagingOrders,
      shippedOrders,
      deliveredOrders,
      rejectedOrders,
      totalRevenue: Number(totalRevenue._sum.totalAmount ?? 0),
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
