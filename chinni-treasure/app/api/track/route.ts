import { NextResponse } from "next/server";
import { withPublic } from "@/src/lib/route-guard";
import { getTrackedOrders, TRACK_CACHE_CONTROL } from "@/src/lib/order-cache";

const CACHE_HEADERS = { headers: { "Cache-Control": TRACK_CACHE_CONTROL } };

// GET /api/track?orderId=xxx or /api/track?phone=xxx
// The Order cache module owns the key, the hit/miss branch and the lookup's own
// 400; the guard owns the "track" rate-limit policy and the failure envelope.
export const GET = withPublic(
  async ({ request }) => {
    const { searchParams } = new URL(request.url);
    const result = await getTrackedOrders(searchParams.get("orderId"), searchParams.get("phone"));
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result.orders, CACHE_HEADERS);
  },
  { rateLimit: "track", fallbackError: "Failed to search orders" },
);
