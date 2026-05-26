import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/auth";

type OrderStatus = "pending" | "approved" | "packaging" | "shipped" | "delivered" | "rejected";

async function checkAuth() {
  const session = await getSession();
  if (!session) return null;
  return session as { id: string; username: string; role: string };
}

// GET /api/stats — Dashboard statistics (admin only)
export async function GET() {
  const admin = await checkAuth();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [orders, totalRevenue] = await Promise.all([
      prisma.order.findMany({
        select: { status: true, totalAmount: true, createdAt: true },
      }),
      prisma.order.aggregate({ _sum: { totalAmount: true } }),
    ]) as [
      Array<{ status: OrderStatus; totalAmount: unknown; createdAt: Date }>,
      { _sum: { totalAmount: unknown | null } },
    ];

    const stats = {
      totalOrders: orders.length,
      pendingOrders: orders.filter((o: { status: string }) => o.status === "pending").length,
      approvedOrders: orders.filter((o: { status: string }) => o.status === "approved").length,
      packagingOrders: orders.filter((o: { status: string }) => o.status === "packaging").length,
      shippedOrders: orders.filter((o: { status: string }) => o.status === "shipped").length,
      deliveredOrders: orders.filter((o: { status: string }) => o.status === "delivered").length,
      rejectedOrders: orders.filter((o: { status: string }) => o.status === "rejected").length,
      totalRevenue: Number(totalRevenue._sum.totalAmount ?? 0),
    };

    // Chart data: last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentOrders = orders.filter((o: { createdAt: Date }) => new Date(o.createdAt) >= thirtyDaysAgo);
    const chartDataMap: Record<string, { orders: number; revenue: number }> = {};

    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
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
      .sort((a: [string, unknown], b: [string, unknown]) => a[0].localeCompare(b[0]))
      .map(([date, data]: [string, { orders: number; revenue: number }]) => ({ date, ...data }));

    // Product sales data
    const orderItems = await prisma.orderItem.findMany({
      select: { productName: true, quantity: true, unitPrice: true },
    });

    const productSalesMap: Record<string, { quantity: number; revenue: number }> = {};
    for (const item of orderItems) {
      if (!productSalesMap[item.productName]) {
        productSalesMap[item.productName] = { quantity: 0, revenue: 0 };
      }
      productSalesMap[item.productName].quantity += item.quantity;
      productSalesMap[item.productName].revenue += Number(item.unitPrice) * item.quantity;
    }

    const productSalesData = Object.entries(productSalesMap)
      .map(([productName, data]: [string, { quantity: number; revenue: number }]) => ({ productName, ...data }))
      .sort((a: { revenue: number }, b: { revenue: number }) => b.revenue - a.revenue);

    return NextResponse.json({ stats, chartData, productSalesData });
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
