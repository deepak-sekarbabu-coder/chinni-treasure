import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

// GET /api/track?orderId=xxx or /api/track?phone=xxx
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    const phone = searchParams.get("phone");

    if (!orderId && !phone) {
      return NextResponse.json({ error: "Provide orderId or phone parameter" }, { status: 400 });
    }

    let orders: Array<Record<string, unknown>> = [];

    if (orderId) {
      orders = await prisma.order.findMany({
        where: { orderNumber: { contains: orderId, mode: "insensitive" } },
        include: { items: true },
        orderBy: { createdAt: "desc" },
      });
    } else {
      const cleanPhone = phone!.replace(/\D/g, "");
      orders = await prisma.order.findMany({
        where: { customerPhone: { contains: cleanPhone } },
        include: { items: true },
        orderBy: { createdAt: "desc" },
      });
    }

    const results = orders.map((o) => ({
      id: o.id as string,
      orderNumber: o.orderNumber as string,
      customerName: o.customerName as string,
      customerEmail: o.customerEmail as string,
      customerPhone: o.customerPhone as string,
      status: o.status as string,
      trackingId: (o.trackingId as string) || null,
      totalAmount: Number(o.totalAmount),
      subtotal: Number(o.subtotal),
      shippingCost: Number(o.shippingCost),
      createdAt: new Date(o.createdAt as string),
      transactionId: (o.transactionId as string) || null,
      customerNotes: (o.customerNotes as string) || null,
      addressLine1: o.addressLine1 as string,
      city: o.city as string,
      stateCode: o.stateCode as string,
      postalCode: o.postalCode as string,
      itemCount: ((o.items as Array<{ quantity: number }>) || []).reduce((sum, i) => sum + i.quantity, 0),
      items: ((o.items as Array<{ id: string; productName: string; unitPrice: number; quantity: number }>) || []).map((i) => ({
        id: i.id,
        productName: i.productName,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
      })),
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error("Failed to search orders:", error);
    return NextResponse.json({ error: "Failed to search orders" }, { status: 500 });
  }
}
