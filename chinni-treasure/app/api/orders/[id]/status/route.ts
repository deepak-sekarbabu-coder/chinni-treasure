import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/auth";

async function checkAuth() {
  const session = await getSession();
  if (!session) return null;
  return session as { id: string; username: string; role: string };
}

const ORDER_STATUS_FLOW = ["pending", "approved", "packaging", "shipped", "delivered"];

// PATCH /api/orders/[id]/status — Update order status (admin only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await checkAuth();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { status, trackingId, notes } = body;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // If rejecting, restore stock
    if (status === "rejected" && order.status !== "rejected") {
      for (const item of order.items) {
        await prisma.product.update({
          where: { id: item.productId! },
          data: { stockQuantity: { increment: item.quantity } },
        });
      }
    }

    // If advancing to shipped, trackingId is required
    if (status === "shipped" && !trackingId) {
      return NextResponse.json({ error: "Tracking ID is required when marking as shipped" }, { status: 400 });
    }

    const updatedData: Record<string, unknown> = {
      status,
      ...(trackingId && { trackingId }),
    };

    // If rejected, keep the previous status for history context
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        ...updatedData,
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
