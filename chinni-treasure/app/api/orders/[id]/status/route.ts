import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { checkAuth } from "@/src/lib/auth";
import { validateCsrfOrigin } from "@/src/lib/csrf";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const ORDER_STATUS_VALUES = ["pending", "approved", "packaging", "shipped", "delivered", "rejected"] as const;
const OrderStatusSchema = z.enum(ORDER_STATUS_VALUES);

const UpdateOrderStatusSchema = z.object({
  status: OrderStatusSchema,
  trackingId: z.string().optional(),
  notes: z.string().optional(),
  expectedVersion: z.number().int().optional(),
});

type OrderStatusValue = "pending" | "approved" | "packaging" | "shipped" | "delivered" | "rejected";

function statusUpdateData(status: OrderStatusValue, trackingId?: string, notes?: string): Prisma.OrderUpdateInput {
  return {
    status,
    version: { increment: 1 },
    ...(trackingId && { trackingId }),
    statusHistory: {
      create: { status, notes: notes || `Status changed to ${status}` },
    },
  };
}

async function rejectWithStockRestore(orderId: string, status: OrderStatusValue, trackingId: string | undefined, notes: string | undefined, items: { id: string; productId: string | null; quantity: number }[]) {
  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId! },
        data: { stockQuantity: { increment: item.quantity } },
      });
    }
    await tx.order.update({
      where: { id: orderId },
      data: statusUpdateData(status, trackingId, notes),
    });
  });
}

async function verifyVersion(orderId: string, expectedVersion?: number): Promise<NextResponse | null> {
  if (expectedVersion === undefined) return null;
  const versionRow = await prisma.order.findUnique({
    where: { id: orderId },
    select: { version: true },
  });
  if (!versionRow || versionRow.version !== expectedVersion) {
    return NextResponse.json(
      { error: "Order was modified by another request. Please refresh and try again." },
      { status: 409 },
    );
  }
  return null;
}

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

    const versionError = await verifyVersion(id, expectedVersion);
    if (versionError) return versionError;

    if (status === "shipped" && !trackingId) {
      return NextResponse.json({ error: "Tracking ID is required when marking as shipped" }, { status: 400 });
    }

    if (status === "rejected" && order.status !== "rejected") {
      await rejectWithStockRestore(id, status, trackingId, notes, order.items);
    } else {
      await prisma.order.update({
        where: { id },
        data: statusUpdateData(status, trackingId, notes),
      });
    }

    const updated = await prisma.order.findUnique({
      where: { id },
      include: { items: true, statusHistory: true },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update order status:", error);
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
  }
}
