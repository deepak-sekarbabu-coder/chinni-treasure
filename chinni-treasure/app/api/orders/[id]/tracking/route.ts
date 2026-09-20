import { NextResponse } from "next/server";
import { invalidateOrderCache } from "@/src/lib/order-cache";
import { withAdmin } from "@/src/lib/admin-route";
import { parseUpdateTrackingInput, setTrackingId } from "@/src/lib/order-intake";

// PATCH /api/orders/[id]/tracking — Update tracking ID (admin only)
// Thin adapter over the Order intake module's fulfilment half, exactly like
// the status route: parse → setTrackingId → error mapping. The module owns
// the existence check, version concurrency, and tracking policy; the
// admin-route adapter owns CSRF/auth/401 and the shared error mapping.
export const PATCH = withAdmin<{ id: string }>(
  async ({ body, params }) => {
    const { id } = params;
    const input = parseUpdateTrackingInput(body);

    const order = await setTrackingId(id, input);

    await invalidateOrderCache(id);

    return NextResponse.json(order);
  },
  {
    parseBody: true,
    fallbackError: "Failed to update tracking ID",
  },
);