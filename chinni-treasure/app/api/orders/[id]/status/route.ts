import { NextResponse } from "next/server";
import { invalidateOrderCache } from "@/src/lib/order-cache";
import { logger } from "@/lib/axiom/server";
import { withAdmin } from "@/src/lib/admin-route";
import {
  parseUpdateOrderStatusInput,
  transitionOrderStatus,
} from "@/src/lib/order-intake";

// PATCH /api/orders/[id]/status — Update order status (admin only)
// Thin adapter over the Order intake module's fulfilment half: parse →
// transitionOrderStatus → error mapping. Transition rules, version
// concurrency, the tracking gate, and stock restore live in the module;
// the admin-route adapter owns CSRF/auth/401 and the shared error mapping.
export const PATCH = withAdmin<{ id: string }>(
  async ({ body, params }) => {
    const { id } = params;
    const input = parseUpdateOrderStatusInput(body);

    const { previousStatus, order } = await transitionOrderStatus(id, input);

    logger.info("Order status changed", {
      orderId: id,
      orderNumber: order.orderNumber,
      from: previousStatus,
      to: input.status,
      trackingId: input.trackingId ?? null,
    });

    await invalidateOrderCache(id);

    return NextResponse.json(order);
  },
  {
    parseBody: true,
    fallbackError: "Failed to update order status",
  },
);
