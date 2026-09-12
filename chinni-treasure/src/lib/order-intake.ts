import { Prisma, PrismaClient, OrderStatus } from "@prisma/client";
import { z } from "zod";
import { generateOrderNumber } from "@/src/lib/utils";
import { sanitize } from "@/src/lib/sanitize";
import {
  ORDER_STATUS_ACTIONS,
  ORDER_STATUS_ALL,
} from "@/src/lib/constants";
import { computePricing } from "@/src/lib/pricing";
import { CheckoutFields } from "@/src/lib/checkout-fields";
import { prisma } from "@/src/lib/prisma";

/**
 * Order intake module.
 *
 * Owns the Order lifecycle policy behind one interface:
 * - placement: `parseCreateOrderInput` + `placeOrder` (validation, gift-box
 *   bundling, inventory transaction, ADR-0002 pricing basis, persistence)
 * - fulfilment: `transitionOrderStatus` (versioned transition validation,
 *   tracking-gate at `shipped`, stock restore on `rejected`)
 * - the `OrderError` taxonomy both paths map to HTTP responses
 *
 * The interface is the test surface: call these functions with a
 * transaction-capable client; no HTTP harness required.
 *
 * Payment amount integrity (paid paise == stored totalAmount, per
 * ADR-0002) is asserted here via `assertPaidAmountMatchesTotal`.
 */

const GiftBoxItemSchema = z.object({
  id: z.string().min(1),
  quantity: z.number().int().positive(),
});

const PaymentGatewaySchema = z.enum(["razorpay", "manual"]);

const CreateOrderSchema = z.object({
  // Per-field checkout rules live in one shared contract (checkout-fields.ts)
  // so the client form, the client API schema, and this server schema can
  // never disagree about a rule or its message.
  customerName: CheckoutFields.customerName,
  customerEmail: CheckoutFields.customerEmail,
  customerPhone: CheckoutFields.customerPhone,
  addressLine1: CheckoutFields.addressLine1,
  addressLine2: z.string().optional(),
  city: CheckoutFields.city,
  stateCode: CheckoutFields.stateCode,
  postalCode: CheckoutFields.postalCode,
  transactionId: CheckoutFields.transactionId,
  customerNotes: z.string().optional(),
  /** Which channel recorded `transactionId`. Razorpay placements enforce paid == stored. */
  paymentGateway: PaymentGatewaySchema.default("razorpay"),
  /** Razorpay order id (`order_…`) the payment was made against. Required for razorpay. */
  razorpayOrderId: z.string().min(1).optional(),
  items: z
    .array(
      z.object({
        id: z.string().min(1, "Product ID is required"),
        quantity: z.number().int().positive("Quantity must be a positive integer"),
        giftBoxes: z.array(GiftBoxItemSchema).optional(),
      }),
    )
    .min(1, "At least one item is required"),
}).superRefine((data, ctx) => {
  if (data.paymentGateway === "razorpay" && !data.razorpayOrderId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["razorpayOrderId"],
      message: "Razorpay order ID is required for Razorpay payments",
    });
  }
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

/** The client may send an unvalidated payload; parse it here, fail as OrderError. */
export function parseCreateOrderInput(raw: unknown): CreateOrderInput {
  const parsed = CreateOrderSchema.safeParse(raw);
  if (!parsed.success) {
    throw new OrderError(
      parsed.error.issues.map((i) => i.message).join(", "),
      400,
    );
  }
  return parsed.data;
}

/** Error taxonomy of the Order intake — the adapter maps statusCode → HTTP response. */
export class OrderError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * ADR-0002 invariant: the amount the customer paid (integer paise charged by
 * the gateway) must equal the server-computed order total. Callers that know
 * the charged amount (the Razorpay flow) assert before the order is stored.
 */
export function assertPaidAmountMatchesTotal(paidPaise: number, totalAmountRupees: number): void {
  const expectedPaise = Math.round(totalAmountRupees * 100);
  if (paidPaise !== expectedPaise) {
    throw new OrderError(
      "Payment amount does not match the order total. Please contact support.",
      400,
    );
  }
}

/**
 * Place an Order. Runs the whole intake policy inside a serializable
 * transaction: product lookup, gift-box bundling rules, stock checks,
 * atomic stock decrements, pricing (ADR-0002 basis), persistence with
 * line-item snapshots and initial status history.
 *
 * The paid-amount invariant is enforced here, at the seam: when the caller
 * provides `resolvedPaidPaise` (the authoritative amount fetched from the
 * gateway — never a client-claimed value), it must equal the server-computed
 * total, or the order is not stored. Manual placements (bank transfer) carry
 * no gateway charge to compare, so the invariant does not apply.
 */
export async function placeOrder(
  input: CreateOrderInput,
  options: {
    /** Authoritative charged amount in integer paise, resolved from the gateway. */
    resolvedPaidPaise?: number;
    /** Transaction-capable client; defaults to the shared Prisma instance. */
    db?: Pick<PrismaClient, "$transaction">;
  } = {},
): Promise<Prisma.OrderGetPayload<{ include: { items: true } }>> {
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
  } = input;
  const { resolvedPaidPaise, db = prisma } = options;

  const order = await db.$transaction(
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

      // ADR-0002 paid == stored, enforced at the seam before persistence.
      // The comparison is integer-paise on both sides.
      if (resolvedPaidPaise !== undefined) {
        assertPaidAmountMatchesTotal(resolvedPaidPaise, totalAmount);
      }

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

  return order;
}

// ───────────────────────────────────────────────────────────────────────────
// Fulfilment — the status-flow half of the Order lifecycle
// ---------------------------------------------------------------------------
// pending → approved → packaging → shipped → delivered
//       ↘ rejected (restores stock)

const OrderStatusSchema = z.enum(ORDER_STATUS_ALL);

const UpdateOrderStatusSchema = z.object({
  status: OrderStatusSchema,
  trackingId: z.string().optional(),
  notes: z.string().optional(),
  expectedVersion: z.number().int().optional(),
});

export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;

/** The full Order shape the transition returns (order + items + history). */
export type OrderWithHistory = Prisma.OrderGetPayload<{ include: { items: true; statusHistory: true } }>;

/** Result of a successful transition: the updated order plus the status it moved from. */
export interface TransitionResult {
  previousStatus: OrderStatus;
  order: OrderWithHistory;
}

/** Parse an unvalidated transition request; fails as OrderError/400. */
export function parseUpdateOrderStatusInput(raw: unknown): UpdateOrderStatusInput {
  const parsed = UpdateOrderStatusSchema.safeParse(raw);
  if (!parsed.success) {
    throw new OrderError(
      parsed.error.issues.map((i) => i.message).join(", "),
      400,
    );
  }
  return parsed.data;
}

/**
 * Validate a transition from `current` to `next` against the shared
 * `ORDER_STATUS_ACTIONS` table. Returns an error message when the transition
 * is not allowed, else null.
 */
export function validateTransition(current: OrderStatus, next: OrderStatus): string | null {
  if (current === next) {
    return `Order is already ${current}`;
  }

  // Terminal states first — nothing may leave `rejected` or `delivered`.
  if (current === "rejected") {
    return "A rejected order cannot be re-opened";
  }
  if (current === "delivered") {
    return "A delivered order is final";
  }

  const allowed: readonly OrderStatus[] = ORDER_STATUS_ACTIONS[current];
  if (!allowed.includes(next)) {
    return `Cannot move from ${current} to ${next}`;
  }

  return null;
}

function statusUpdateData(
  status: OrderStatus,
  trackingId?: string,
  notes?: string,
): Prisma.OrderUpdateInput {
  return {
    status,
    version: { increment: 1 },
    ...(trackingId && { trackingId }),
    statusHistory: {
      create: { status, notes: notes || `Status changed to ${status}` },
    },
  };
}

/**
 * Transition an Order's status. Owns the fulfilment policy:
 *
 * - versioned optimistic concurrency (`expectedVersion` compared, then
 *   the update bumps `version`)
 * - tracking gate: `shipped` requires a tracking ID
 * - transition validation against the fulfilment flow (including the
 *   terminal states `rejected` and `delivered`)
 * - stock restore inside a transaction when the order moves to `rejected`
 *
 * Throws `OrderError` (statusCode 400/404/409) — the adapter maps it to HTTP.
 */
export async function transitionOrderStatus(
  orderId: string,
  input: UpdateOrderStatusInput,
  db: Pick<PrismaClient, "order" | "$transaction"> = prisma,
): Promise<TransitionResult> {
  const { status, trackingId, notes, expectedVersion } = input;

  if (status === "shipped" && !trackingId) {
    throw new OrderError("Tracking ID is required when marking as shipped", 400);
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: { select: { productId: true, quantity: true } } },
  });
  if (!order) {
    throw new OrderError("Order not found", 404);
  }

  if (expectedVersion !== undefined && order.version !== expectedVersion) {
    throw new OrderError(
      "Order was modified by another request. Please refresh and try again.",
      409,
    );
  }

  const transitionError = validateTransition(order.status, status);
  if (transitionError) {
    throw new OrderError(transitionError, 400);
  }

  const previousStatus = order.status;

  if (status === "rejected" && order.status !== "rejected") {
    // Stock restore and the status flip must be atomic.
    await db.$transaction(async (tx) => {
      for (const item of order.items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stockQuantity: { increment: item.quantity } },
          });
        }
      }
      await tx.order.update({
        where: { id: orderId },
        data: statusUpdateData(status, trackingId, notes),
      });
    });
  } else {
    await db.order.update({
      where: { id: orderId },
      data: statusUpdateData(status, trackingId, notes),
    });
  }

  const updated = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true, statusHistory: true },
  });
  if (!updated) {
    throw new OrderError("Order not found", 404);
  }
  return { previousStatus, order: updated as OrderWithHistory };
}
