import { NextResponse } from "next/server";
import { logger } from "@/lib/axiom/server";
import { getTrackedOrders } from "@/src/lib/order-cache";
import { checkRateLimit, getClientIp } from "@/src/lib/rate-limiter";

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
    const result = await getTrackedOrders(searchParams.get("orderId"), searchParams.get("phone"));
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result.orders, CACHE_HEADERS);
  } catch (error) {
    logger.error("Failed to search orders", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to search orders" }, { status: 500 });
  }
}