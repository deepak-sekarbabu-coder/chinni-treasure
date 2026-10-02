import { NextResponse } from "next/server";
import { getOrderDetailForAudience } from "@/src/lib/order-cache";
import { withPublic } from "@/src/lib/route-guard";

// GET /api/orders/[id]?phone=xxx
// The Order cache module owns the read AND the audience rule: an
// unauthenticated caller gets the same contract as /api/track (id + phone,
// rate-limited), because a bare UUID is not a credential. The confirmation page
// reads the same cache in-process behind the order number, so nothing in-app
// is gated by this. The guard owns the failure envelope.
export const GET = withPublic<{ id: string }>(
  async ({ request, params }) => {
    const result = await getOrderDetailForAudience(
      params.id,
      new URL(request.url).searchParams.get("phone"),
    );
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    // private, no-store: the body is PII keyed by a phone number, so a shared
    // edge cache must not hold it. The order-detail TTL still serves the
    // server-side read (in-process callers), which is where the speed is.
    return NextResponse.json(result.order, {
      headers: { "Cache-Control": "private, no-store" },
    });
  },
  { rateLimit: "track", fallbackError: "Failed to fetch order" },
);
