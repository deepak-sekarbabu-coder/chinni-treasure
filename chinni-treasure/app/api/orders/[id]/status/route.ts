import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { checkAuth } from "@/src/lib/auth";
import { validateCsrfOrigin } from "@/src/lib/csrf";
import { z } from "zod";

const ORDER_STATUS_VALUES = ["pending", "approved", "packaging", "shipped", "delivered", "rejected"] as const;
const OrderStatusSchema = z.enum(ORDER_STATUS_VALUES);

const UpdateOrderStatusSchema = z.object({
  status: OrderStatusSchema,
  trackingId: z.string().optional(),
  notes: z.string().optional(),
  expectedVersion: z.number().int().optional(),
});

// PATCH /api/orders/[id]/status — Update order status (admin only)
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
    const parsed = UpdateOrderStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 },
      );
    }
    const { status, trackingId, notes, expectedVersion } = parsed.data;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: { select: { id: true, productId: true, quantity: true } } },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Fetch version separately for optimistic locking
    const versionRow = await prisma.order.findUnique({
      where: { id },
      select: { version: true },
    });

    // Optimistic locking: verify version matches
    if (expectedVersion !== undefined && (!versionRow || versionRow.version !== expectedVersion)) {
      return NextResponse.json(
        { error: "Order was modified by another request. Please refresh and try again." },
        { status: 409 },
      );
    }

    // If rejecting, restore stock (inside transaction)
    if (status === "rejected" && order.status !== "rejected") {
      await prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId! },
            data: { stockQuantity: { increment: item.quantity } },
          });
        }
        await tx.order.update({
          where: { id },
          data: {
            status,
            version: { increment: 1 },
            ...(trackingId && { trackingId }),
            statusHistory: {
              create: {
                status,
                notes: notes || `Status changed to ${status}`,
              },
            },
          },
        });
      });
      const updated = await prisma.order.findUnique({
        where: { id },
        include: { items: true, statusHistory: true },
      });
      return NextResponse.json(updated);
    }

    // If advancing to shipped, trackingId is required
    if (status === "shipped" && !trackingId) {
      return NextResponse.json({ error: "Tracking ID is required when marking as shipped" }, { status: 400 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status,
        version: { increment: 1 },
        ...(trackingId && { trackingId }),
        statusHistory: {
          create: {
            status,
            notes: notes || `Status changed to ${status}`,
          },
        },
      },
      include: { items: true, statusHistory: true },
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Failed to update order status:", error);
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
  }
}
