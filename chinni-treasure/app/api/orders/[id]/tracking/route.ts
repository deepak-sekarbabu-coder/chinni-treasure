import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { validateOr400 } from "@/src/lib/validate";
import { invalidateOrderCache } from "@/src/lib/order-cache";
import { withAdmin } from "@/src/lib/admin-route";
import { UpdateTrackingInputSchema } from "@/src/lib/api/schemas";

// PATCH /api/orders/[id]/tracking — Update tracking ID (admin only)
export const PATCH = withAdmin<{ id: string }>(
  async ({ body, params }) => {
    const { id } = params;
    const parsed = validateOr400(UpdateTrackingInputSchema, body);
    if (!parsed.ok) return parsed.response;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { trackingId: parsed.data.trackingId },
      include: { items: true, statusHistory: true },
    });

    await invalidateOrderCache(id);

    return NextResponse.json(updated);
  },
  {
    parseBody: true,
    fallbackError: "Failed to update tracking ID",
    errorMessages: {
      p2025: "Order not found",
    },
  },
);
