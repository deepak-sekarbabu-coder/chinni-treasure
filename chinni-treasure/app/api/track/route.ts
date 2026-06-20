import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import type { Order, OrderItem } from "@prisma/client";
import { createCache } from "@/src/lib/cache";

const { get: getCached, set: setCache } = createCache(15_000);
const CACHE_HEADERS = { headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30" } };

function buildCacheKey(orderId: string | null, phone: string | null): string | null {
  if (orderId) return `track:${orderId}`;
  if (phone) return `track:${phone.replace(/\D/g, "")}`;
  return null;
}

type QueryResult = { error: string; status: number } | { orders: (Order & { items: OrderItem[] })[] } | null;

async function queryByOrderId(orderId: string): Promise<QueryResult> {
  if (orderId.length > 36 || !/^[a-zA-Z0-9-]+$/.test(orderId)) {
    return { error: "Invalid order ID format", status: 400 };
  }
  const orders = await prisma.order.findMany({
    where: { orderNumber: { contains: orderId, mode: "insensitive" } },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  return { orders };
}

async function queryByPhone(phone: string): Promise<QueryResult> {
  const cleanPhone = phone.replace(/\D/g, "");
  if (cleanPhone.length !== 10) {
    return { error: "Phone must be exactly 10 digits", status: 400 };
  }
  const orders = await prisma.order.findMany({
    where: { customerPhone: cleanPhone },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  return { orders };
}

function formatOrderResults(orders: (Order & { items: OrderItem[] })[]) {
  return orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    trackingId: o.trackingId || null,
    totalAmount: Number(o.totalAmount),
    createdAt: o.createdAt,
    itemCount: (o.items || []).reduce((sum, i) => sum + i.quantity, 0),
    items: (o.items || []).map((i) => ({
      id: i.id,
      productName: i.productName,
      unitPrice: Number(i.unitPrice),
      quantity: i.quantity,
    })),
  }));
}

// GET /api/track?orderId=xxx or /api/track?phone=xxx
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    const phone = searchParams.get("phone");

    const cacheKey = buildCacheKey(orderId, phone);
    if (cacheKey) {
      const cached = getCached(cacheKey);
      if (cached) {
        return NextResponse.json(cached, CACHE_HEADERS);
      }
    }

    if (!orderId && !phone) {
      return NextResponse.json({ error: "Provide orderId or phone parameter" }, { status: 400 });
    }

    const result = orderId ? await queryByOrderId(orderId) : await queryByPhone(phone!);
    if (result && "error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const orders = (result as { orders: (Order & { items: OrderItem[] })[] }).orders;
    const formatted = formatOrderResults(orders);

    if (cacheKey) {
      setCache(cacheKey, formatted);
    }

    return NextResponse.json(formatted, CACHE_HEADERS);
  } catch (error) {
    console.error("Failed to search orders:", error);
    return NextResponse.json({ error: "Failed to search orders" }, { status: 500 });
  }
}
