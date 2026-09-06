import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { Prisma, OrderStatus } from "@prisma/client";
import { checkAuth } from "@/src/lib/auth";
import { generateOrderNumber } from "@/src/lib/utils";
import { sanitize } from "@/src/lib/sanitize";
import { validateCsrfOrigin } from "@/src/lib/csrf";
import { validateOr400 } from "@/src/lib/validate";
import { checkRateLimit, getClientIp } from "@/src/lib/rate-limiter";
import { z } from "zod";
import { INDIAN_STATES } from "@/src/lib/constants";
import { computePricing } from "@/src/lib/pricing";

const GiftBoxItemSchema = z.object({
  id: z.string().min(1),
  quantity: z.number().int().positive(),
});

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
        giftBoxes: z.array(GiftBoxItemSchema).optional(),
      }),
    )
    .min(1, "At least one item is required"),
});

const ORDERS_LIST_SCHEMA = z.object({
  sort: z
    .enum(["date-desc", "date-asc", "total-desc", "total-asc"])
    .default("date-desc"),
});

const ORDER_SORTS: Record<
  "date-desc" | "date-asc" | "total-desc" | "total-asc",
  Prisma.OrderOrderByWithRelationInput
> = {
  "date-desc": { createdAt: "desc" },
  "date-asc": { createdAt: "asc" },
  "total-desc": { totalAmount: "desc" },
  "total-asc": { totalAmount: "asc" },
};

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

  const sortParse = validateOr400(ORDERS_LIST_SCHEMA, {
    sort: searchParams.get("sort") ?? undefined,
  });
  if (!sortParse.ok) return sortParse.response;
  const sort = sortParse.data.sort;

  try {
    const where = status ? { status: status as OrderStatus } : {};

    // Sequential queries to avoid saturating Nhost's pooler with
    // concurrent connections.
    const orders = await prisma.order.findMany({
      where,
      include: { items: { include: { product: true } } },
      orderBy: ORDER_SORTS[sort],
      skip,
      take: limit,
    });
    const total = await prisma.order.count({ where });

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

  const { allowed } = await checkRateLimit(`order:${getClientIp(request)}`, 3);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many order attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  try {
    const body = await request.json();
    const parsed = validateOr400(CreateOrderSchema, body);
    if (!parsed.ok) return parsed.response;
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
        const allProductIds = new Set<string>(items.map((i) => i.id));
        for (const item of items) {
          if (item.giftBoxes) {
            for (const gb of item.giftBoxes) allProductIds.add(gb.id);
          }
        }
        const products = await tx.product.findMany({
          where: { id: { in: [...allProductIds] }, isActive: true },
          include: { category: { select: { slug: true } } },
        });

        const productMap = new Map(products.map((p) => [p.id, p]));

        const orderItems: Array<{
          productId: string;
          productName: string;
          unitPrice: number;
          quantity: number;
        }> = [];

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

          // Validate gift box bundling rules
          if (item.giftBoxes && item.giftBoxes.length > 0) {
            // A gift box product cannot be used as a bundle parent
            if (product.category?.slug === "box") {
              throw new OrderError(
                "Gift box products cannot be bundled onto other products",
                400,
              );
            }
            // Parent must support bundling
            if (!product.allowGiftBoxBundling) {
              throw new OrderError(
                `Product ${product.name} does not support gift box bundling`,
                400,
              );
            }
            for (const gb of item.giftBoxes) {
              const gbProduct = productMap.get(gb.id);
              if (!gbProduct) {
                throw new OrderError(`Gift box product ${gb.id} not found`, 404);
              }
              if (gbProduct.category?.slug !== "box") {
                throw new OrderError(
                  `Product ${gbProduct.name} is not a gift box`,
                  400,
                );
              }
              if (gbProduct.stockQuantity < gb.quantity) {
                throw new OrderError(
                  `Insufficient stock for gift box ${gbProduct.name}. Available: ${gbProduct.stockQuantity}`,
                  400,
                );
              }
              if (gb.quantity > item.quantity) {
                throw new OrderError(
                  `Gift box quantity cannot exceed the parent product quantity`,
                  400,
                );
              }
            }
          }

          orderItems.push({
            productId: product.id,
            productName: product.name,
            unitPrice: Number(product.price),
            quantity: item.quantity,
          });
        }

        // Build flat priced lines (parents + gift boxes) for the pricing module
        const lines: Array<{ price: number; quantity: number; sku?: string }> = [];
        for (const item of items) {
          const product = productMap.get(item.id)!;
          lines.push({ price: Number(product.price), quantity: item.quantity, sku: product.sku ?? undefined });
          if (item.giftBoxes) {
            for (const gb of item.giftBoxes) {
              const gbProduct = productMap.get(gb.id)!;
              lines.push({ price: Number(gbProduct.price), quantity: gb.quantity, sku: gbProduct.sku ?? undefined });
            }
          }
        }
        const { subtotal, shippingCost, totalAmount } = computePricing(lines, stateCode);

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

        // Create gift box order items linked to parent items
        const giftBoxEntries: Array<{
          orderId: string;
          productId: string;
          productName: string;
          unitPrice: number;
          quantity: number;
          parentOrderItemId: string;
        }> = [];
        for (const item of items) {
          if (!item.giftBoxes || item.giftBoxes.length === 0) continue;
          const parentOrderItem = created.items.find((oi) => oi.productId === item.id);
          if (!parentOrderItem) continue;
          for (const gb of item.giftBoxes) {
            const gbProduct = productMap.get(gb.id)!;
            giftBoxEntries.push({
              orderId: created.id,
              productId: gbProduct.id,
              productName: gbProduct.name,
              unitPrice: Number(gbProduct.price),
              quantity: gb.quantity,
              parentOrderItemId: parentOrderItem.id,
            });
          }
        }
        if (giftBoxEntries.length > 0) {
          await tx.orderItem.createMany({ data: giftBoxEntries });
        }

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
        // Deduct gift box stock
        for (const gbEntry of giftBoxEntries) {
          await tx.product.update({
            where: { id: gbEntry.productId },
            data: { stockQuantity: { decrement: gbEntry.quantity } },
          });
        }

        // Re-fetch the order with all items
        const finalOrder = await tx.order.findUnique({
          where: { id: created.id },
          include: { items: true },
        });
        return finalOrder ?? created;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 15_000,
        timeout: 10_000,
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
