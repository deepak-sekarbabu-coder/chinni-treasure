import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/auth";
import { generateOrderNumber } from "@/src/lib/utils";

async function checkAuth() {
  const session = await getSession();
  if (!session) return null;
  return session as { id: string; username: string; role: string };
}

// GET /api/orders — List all orders (admin only)
export async function GET() {
  const admin = await checkAuth();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const orders = await prisma.order.findMany({
      include: {
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(orders);
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

// POST /api/orders — Place a new order
export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const customerName = body["customerName"] as string | undefined;
    const customerEmail = body["customerEmail"] as string | undefined;
    const customerPhone = body["customerPhone"] as string | undefined;
    const addressLine1 = body["addressLine1"] as string | undefined;
    const addressLine2 = body["addressLine2"] as string | undefined;
    const city = body["city"] as string | undefined;
    const stateCode = body["stateCode"] as string | undefined;
    const postalCode = body["postalCode"] as string | undefined;
    const transactionId = body["transactionId"] as string | undefined;
    const customerNotes = body["customerNotes"] as string | undefined;
    const items = body["items"] as Array<{ id: string; quantity: number }> | undefined;

    // Validate required fields
    if (!items?.length || !customerName || !customerEmail || !customerPhone || !addressLine1 || !city || !stateCode || !postalCode || !transactionId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Fetch product details for pricing
    const productIds = items.map((i: { id: string }) => i.id);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Calculate totals and validate stock
    const orderItems: Array<{
      productId: string;
      productName: string;
      unitPrice: number;
      quantity: number;
    }> = [];

    let subtotal = 0;

    for (const item of items) {
      const product = productMap.get(item.id);
      if (!product) {
        return NextResponse.json({ error: `Product ${item.id} not found` }, { status: 404 });
      }
      if (product.stockQuantity < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}` },
          { status: 400 },
        );
      }

      orderItems.push({
        productId: product.id,
        productName: product.name,
        unitPrice: Number(product.price),
        quantity: item.quantity,
      });
      subtotal += Number(product.price) * item.quantity;
    }

    const shippingCost = 0; // Free shipping
    const totalAmount = subtotal + shippingCost;

    // Create order with items
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerName,
        customerEmail,
        customerPhone: customerPhone.replace(/\D/g, ""),
        addressLine1,
        addressLine2: addressLine2 || null,
        city,
        stateCode,
        postalCode: postalCode.replace(/\D/g, ""),
        countryCode: "IN",
        subtotal,
        shippingCost,
        totalAmount,
        transactionId: transactionId,
        customerNotes: customerNotes || null,
        items: {
          create: orderItems,
        },
        statusHistory: {
          create: {
            status: "pending",
            notes: "Order placed",
          },
        },
      },
      include: {
        items: true,
      },
    });

    // Deduct stock
    for (const item of orderItems) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { decrement: item.quantity } },
      });
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Failed to create order:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
