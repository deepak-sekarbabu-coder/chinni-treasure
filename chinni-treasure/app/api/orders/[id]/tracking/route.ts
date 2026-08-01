import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { checkAuth } from "@/src/lib/auth";
import { validateCsrfOrigin } from "@/src/lib/csrf";
import { invalidateOrderCache } from "@/src/lib/cache-invalidate";
import { z } from "zod";

const UpdateTrackingSchema = z.object({
  trackingId: z.string().min(1, "Tracking ID is required"),
});

// PATCH /api/orders/[id]/tracking — Update tracking ID (admin only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const csrfError = validateCsrfOrigin(request);
  if (csrfError) return csrfError;

  const admin = await checkAuth();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = UpdateTrackingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 },
      );
    }

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
  } catch (error) {
    console.error("Failed to update tracking ID:", error);
    return NextResponse.json({ error: "Failed to update tracking ID" }, { status: 500 });
  }
}
