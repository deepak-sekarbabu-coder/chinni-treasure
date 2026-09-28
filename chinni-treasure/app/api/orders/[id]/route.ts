import { NextResponse } from "next/server";
import { getOrderDetail } from "@/src/lib/order-cache";
import { withPublic } from "@/src/lib/route-guard";

// GET /api/orders/[id] — Get a single order by ID. The Order cache module owns
// the read; the guard owns the failure envelope.
export const GET = withPublic<{ id: string }>(
  async ({ params }) => {
    const order = await getOrderDetail(params.id);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  },
  { fallbackError: "Failed to fetch order" },
);
