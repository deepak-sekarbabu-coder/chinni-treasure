import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { Prisma, OrderStatus } from "@prisma/client";
import { getSession } from "@/src/lib/auth";
import { generateOrderNumber } from "@/src/lib/utils";
import { sanitize } from "@/src/lib/sanitize";

async function checkAuth() {
  const session = await getSession();
  if (!session) return null;
  return session as { id: string; username: string; role: string };
}

// GET /api/orders — List paginated orders (admin only)
export async function GET(request: Request) {
  const admin = await checkAuth();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10")));
  const status = searchParams.get("status");
  const skip = (page - 1) * limit;

  try {
    const where = status ? { status: status as OrderStatus } : {};

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
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

    const order = await prisma.$transaction(
      async (tx) => {
        // Re-read products inside the transaction for fresh data
        const productIds = items.map((i: { id: string }) => i.id);
        const products = await tx.product.findMany({
          where: { id: { in: productIds }, isActive: true },
        });

        const productMap = new Map(products.map((p) => [p.id, p]));

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
            throw new OrderError(`Product ${item.id} not found`, 404);
          }
          if (product.stockQuantity < item.quantity) {
            throw new OrderError(
              `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}`,
              400,
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

        const shippingCost = 0;
        const totalAmount = subtotal + shippingCost;

        const created = await tx.order.create({
          data: {
            orderNumber: generateOrderNumber(),
            customerName: sanitize(customerName),
            customerEmail: sanitize(customerEmail),
            customerPhone: customerPhone.replace(/\D/g, ""),
            addressLine1: sanitize(addressLine1),
            addressLine2: addressLine2 ? sanitize(addressLine2) : null,
            city: sanitize(city),
            stateCode,
            postalCode: postalCode.replace(/\D/g, ""),
            countryCode: "IN",
            subtotal,
            shippingCost,
            totalAmount,
            transactionId: transactionId,
            customerNotes: customerNotes ? sanitize(customerNotes) : null,
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

        // Deduct stock atomically within the same transaction
        for (const item of orderItems) {
          const updated = await tx.product.update({
            where: { id: item.productId },
            data: { stockQuantity: { decrement: item.quantity } },
          });

          if (updated.stockQuantity < 0) {
            throw new OrderError(
              `Insufficient stock for product ${item.productName}`,
              400,
            );
          }
        }

        return created;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 10000,
      },
    );

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    if (error instanceof OrderError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2034") {
        return NextResponse.json(
          { error: "Conflict detected. Please retry your order." },
          { status: 409 },
        );
      }
    }
    console.error("Failed to create order:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}

class OrderError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}
