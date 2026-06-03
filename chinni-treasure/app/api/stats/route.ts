import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { checkAuth } from "@/src/lib/auth";

// ---- In-memory cache (per-instance, lost on cold start) ----
const cache = new Map<string, { data: unknown; expiry: number }>();
const CACHE_TTL = 30_000; // 30 seconds

function getCached(key: string): unknown | null {
  const entry = cache.get(key);
  if (entry && entry.expiry > Date.now()) return entry.data;
  cache.delete(key);
  return null;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, expiry: Date.now() + CACHE_TTL });
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

    // Lighter: use count queries per status instead of fetching all orders
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
      orderItems,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: "pending" } }),
      prisma.order.count({ where: { status: "approved" } }),
      prisma.order.count({ where: { status: "packaging" } }),
      prisma.order.count({ where: { status: "shipped" } }),
      prisma.order.count({ where: { status: "delivered" } }),
      prisma.order.count({ where: { status: "rejected" } }),
      prisma.order.aggregate({ _sum: { totalAmount: true } }),
      // Only fetch last 30 days for chart data
      prisma.order.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { totalAmount: true, createdAt: true },
      }),
      // Product sales from sold items
      prisma.orderItem.findMany({
        select: { productName: true, quantity: true, unitPrice: true },
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

    // ---- Product sales ----
    const productSalesMap: Record<string, { quantity: number; revenue: number }> = {};
    for (const item of orderItems) {
      const prev = productSalesMap[item.productName];
      if (prev) {
        prev.quantity += item.quantity;
        prev.revenue += Number(item.unitPrice) * item.quantity;
      } else {
        productSalesMap[item.productName] = {
          quantity: item.quantity,
          revenue: Number(item.unitPrice) * item.quantity,
        };
      }
    }

    const productSalesData = Object.entries(productSalesMap)
      .map(([productName, data]) => ({ productName, ...data }))
      .sort((a, b) => b.revenue - a.revenue);

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
