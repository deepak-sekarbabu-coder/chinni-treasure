import { NextResponse } from "next/server";
import type { Order, OrderItem } from "@prisma/client";
import { trackingCache } from "@/src/lib/order-cache";
import { checkRateLimit, getClientIp } from "@/src/lib/rate-limiter";
import {
  buildTrackCacheKey,
  queryOrdersByOrderId,
  queryOrdersByPhone,
  formatOrderResults,
} from "@/src/lib/order-read";

const { get: getCached, set: setCache } = trackingCache;
const CACHE_HEADERS = { headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30" } };

// GET /api/track?orderId=xxx or /api/track?phone=xxx
export async function GET(request: Request) {
  try {
    const { allowed } = await checkRateLimit(`track:${getClientIp(request)}`, 10);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many tracking requests. Please try again later." },
        { status: 429, headers: { "Retry-After": "60" } },
      );
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    const phone = searchParams.get("phone");

    const cacheKey = buildTrackCacheKey(orderId, phone);
    if (cacheKey) {
      const cached = await getCached(cacheKey);
      if (cached) {
        return NextResponse.json(cached, CACHE_HEADERS);
      }
    }

    if (!orderId && !phone) {
      return NextResponse.json({ error: "Provide orderId or phone parameter" }, { status: 400 });
    }

    const result = orderId ? await queryOrdersByOrderId(orderId) : await queryOrdersByPhone(phone!);
    if (result && "error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const orders = (result as { orders: (Order & { items: OrderItem[] })[] }).orders;
    const formatted = formatOrderResults(orders);

    if (cacheKey) {
      await setCache(cacheKey, formatted);
    }

    return NextResponse.json(formatted, CACHE_HEADERS);
  } catch (error) {
    console.error("Failed to search orders:", error);
    return NextResponse.json({ error: "Failed to search orders" }, { status: 500 });
  }
}