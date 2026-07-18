import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { Prisma, OrderStatus } from "@prisma/client";
import { checkAuth } from "@/src/lib/auth";
import { generateOrderNumber } from "@/src/lib/utils";
import { sanitize } from "@/src/lib/sanitize";
import { validateCsrfOrigin } from "@/src/lib/csrf";
import { z } from "zod";
import { INDIAN_STATES, calcShippingCost } from "@/src/lib/constants";

const CreateOrderSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email("Invalid email address"),
  customerPhone: z.string().regex(/^\d{10}$/, "Phone must be exactly 10 digits"),
  addressLine1: z.string().min(1, "Address line 1 is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  stateCode: z
    .string()
    .length(2, "State code must be 2 characters")
    .refine(
      (code) => INDIAN_STATES.some((s) => s.code === code),
      "Invalid state code",
    ),
  postalCode: z.string().regex(/^\d{6}$/, "Postal code must be 6 digits"),
  transactionId: z.string().min(1, "Transaction ID is required"),
  customerNotes: z.string().optional(),
  items: z
    .array(
      z.object({
        id: z.string().min(1, "Product ID is required"),
        quantity: z.number().int().positive("Quantity must be a positive integer"),
      }),
    )
    .min(1, "At least one item is required"),
});

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
        include: { items: { include: { product: true } } },
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
  const csrfError = validateCsrfOrigin(request);
  if (csrfError) return csrfError;

  try {
    const body = await request.json();
    const parsed = CreateOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 },
      );
    }
    const {
      customerName,
      customerEmail,
      customerPhone,
      addressLine1,
      addressLine2,
      city,
      stateCode,
      postalCode,
      transactionId,
      customerNotes,
      items,
    } = parsed.data;

    const order = await prisma.$transaction(
      async (tx) => {
        // Re-read products inside the transaction for fresh data
        const productIds = items.map((i) => i.id);
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

        const shippingCost = calcShippingCost(subtotal, stateCode);
        const totalAmount = subtotal + shippingCost;

        const created = await tx.order.create({
          data: {
            orderNumber: generateOrderNumber(),
            customerName: sanitize(customerName),
            customerEmail: sanitize(customerEmail),
            customerPhone,
            addressLine1: sanitize(addressLine1),
            addressLine2: addressLine2 ? sanitize(addressLine2) : null,
            city: sanitize(city),
            stateCode,
            postalCode,
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
