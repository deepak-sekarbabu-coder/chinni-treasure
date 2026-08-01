import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { createRedisCache } from "@/src/lib/redis-cache";

const { get: getCached, set: setCache } = createRedisCache(30_000, "order");

// GET /api/orders/[id] — Get a single order by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const cached = await getCached(id);
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      });
    }
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } }, statusHistory: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    await setCache(id, order);

    return NextResponse.json(order, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("Failed to fetch order:", error);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}
