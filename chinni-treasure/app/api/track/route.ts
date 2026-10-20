import { NextResponse } from "next/server";
import { withPublic } from "@/src/lib/route-guard";
import { getTrackedOrders } from "@/src/lib/order-cache";

// GET /api/track?orderId=xxx or /api/track?phone=xxx
// The Order cache module owns the key, the hit/miss branch and the lookup's own
// 400; the guard owns the "track" rate-limit policy and the failure envelope.
export const GET = withPublic(
  async ({ request }) => {
    const { searchParams } = new URL(request.url);
    const result = await getTrackedOrders(
      searchParams.get("orderId")?.trim() ?? null,
      searchParams.get("phone"),
    );
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    // private, no-store: the body is customer PII, so a shared edge cache must
    // not hold it. The tracking cache still serves the server-side read.
    return NextResponse.json(result.orders, {
      headers: { "Cache-Control": "private, no-store" },
    });
  },
  { rateLimit: "track", fallbackError: "Failed to search orders" },
);
