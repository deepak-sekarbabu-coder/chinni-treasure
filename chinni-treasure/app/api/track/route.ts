import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import type { Order, OrderItem } from "@prisma/client";
import { createCache } from "@/src/lib/cache";

const { get: getCached, set: setCache } = createCache(15_000);

// GET /api/track?orderId=xxx or /api/track?phone=xxx
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    const phone = searchParams.get("phone");

    // Use query params as cache key for repeat lookups
    const cacheKey = orderId ? `track:${orderId}` : phone ? `track:${phone.replace(/\D/g, "")}` : null;
    if (cacheKey) {
      const cached = getCached(cacheKey);
      if (cached) {
        return NextResponse.json(cached, {
          headers: {
            "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
          },
        });
      }
    }

    if (!orderId && !phone) {
      return NextResponse.json({ error: "Provide orderId or phone parameter" }, { status: 400 });
    }

    let orders: (Order & { items: OrderItem[] })[] = [];

    if (orderId) {
      if (orderId.length > 36 || !/^[a-zA-Z0-9-]+$/.test(orderId)) {
        return NextResponse.json({ error: "Invalid order ID format" }, { status: 400 });
      }
      orders = await prisma.order.findMany({
        where: { orderNumber: { contains: orderId, mode: "insensitive" } },
        include: { items: true },
        orderBy: { createdAt: "desc" },
      });
    } else {
      const cleanPhone = phone!.replace(/\D/g, "");
      if (cleanPhone.length !== 10) {
        return NextResponse.json({ error: "Phone must be exactly 10 digits" }, { status: 400 });
      }
      orders = await prisma.order.findMany({
        where: { customerPhone: cleanPhone },
        include: { items: true },
        orderBy: { createdAt: "desc" },
      });
    }

    const results = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      customerEmail: o.customerEmail,
      customerPhone: o.customerPhone,
      status: o.status,
      trackingId: o.trackingId || null,
      totalAmount: Number(o.totalAmount),
      subtotal: Number(o.subtotal),
      shippingCost: Number(o.shippingCost),
      createdAt: o.createdAt,
      transactionId: o.transactionId || null,
      customerNotes: o.customerNotes || null,
      addressLine1: o.addressLine1,
      city: o.city,
      stateCode: o.stateCode,
      postalCode: o.postalCode,
      itemCount: (o.items || []).reduce((sum, i) => sum + i.quantity, 0),
      items: (o.items || []).map((i) => ({
        id: i.id,
        productName: i.productName,
        unitPrice: Number(i.unitPrice),
        quantity: i.quantity,
      })),
    }));

    if (cacheKey) {
      setCache(cacheKey, results);
    }

    return NextResponse.json(results, {
      headers: {
        "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
      },
    });
  } catch (error) {
    console.error("Failed to search orders:", error);
    return NextResponse.json({ error: "Failed to search orders" }, { status: 500 });
  }
}
