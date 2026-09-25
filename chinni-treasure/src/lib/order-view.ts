import type { Prisma } from "@prisma/client";
import { ORDER_STATUS_FLOW, ORDER_STATUS_VOCABULARY } from "@/src/lib/constants";

/**
 * The Order view module.
 *
 * One projection of "an Order as a surface renders it" — the interface the
 * confirmation page, the tracking results, the order-detail modal and the PDF
 * invoice all consume. Before this module every surface projected the Order
 * itself, and the projections disagreed: the tracking projection dropped the
 * money fields and the gift-box parent link, so the shared modal rendered
 * `₹NaN` and flattened gift boxes on the tracking surface.
 *
 * `orderTimeline` is the same idea for the status timeline: it reads the
 * persisted `OrderStatusHistory` when the surface has it and falls back to the
 * forward flow otherwise, so no surface re-derives the timeline itself.
 */

type OrderRecord = Prisma.OrderGetPayload<{
  include: { items: true; statusHistory: true };
}>;

export interface OrderItemView {
  id: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  parentOrderItemId: string | null;
}

/** One persisted status event. Notes stay server-side — never rendered to a customer. */
export interface OrderStatusEvent {
  status: string;
  at: string;
}

export interface OrderView {
  id: string;
  orderNumber: string;
  status: string;
  trackingId: string | null;
  transactionId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  stateCode: string;
  postalCode: string;
  countryCode: string;
  customerNotes: string | null;
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  createdAt: string;
  itemCount: number;
  items: OrderItemView[];
  statusHistory: OrderStatusEvent[];
}

function statusLabel(status: string): string {
  return ORDER_STATUS_VOCABULARY.labels[status as keyof typeof ORDER_STATUS_VOCABULARY.labels] ?? status;
}

/** Project an order row (items + statusHistory included) into the shared view. */
export function toOrderView(order: OrderRecord): OrderView {
  const items: OrderItemView[] = order.items.map((item) => ({
    id: item.id,
    productName: item.productName,
    unitPrice: Number(item.unitPrice),
    quantity: item.quantity,
    parentOrderItemId: item.parentOrderItemId ?? null,
  }));

  const statusHistory: OrderStatusEvent[] = order.statusHistory
    .map((event) => ({ status: event.status, at: new Date(event.createdAt).toISOString() }))
    .sort((a, b) => a.at.localeCompare(b.at));

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    trackingId: order.trackingId ?? null,
    transactionId: order.transactionId ?? null,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    addressLine1: order.addressLine1,
    addressLine2: order.addressLine2 ?? null,
    city: order.city,
    stateCode: order.stateCode,
    postalCode: order.postalCode,
    countryCode: order.countryCode,
    customerNotes: order.customerNotes ?? null,
    subtotal: Number(order.subtotal),
    shippingCost: Number(order.shippingCost),
    totalAmount: Number(order.totalAmount),
    createdAt: new Date(order.createdAt).toISOString(),
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    items,
    statusHistory,
  };
}

export interface OrderTimelineEntry {
  status: string;
  label: string;
  /** ISO timestamp of the persisted event, or null for a flow-derived step. */
  at: string | null;
  isCurrent: boolean;
}

/**
 * The status timeline: the persisted history when the surface has it, otherwise
 * the forward flow up to the current status. Both paths yield the same entries,
 * so every surface renders the timeline the same way.
 */
export function orderTimeline(
  status: string,
  history?: readonly OrderStatusEvent[],
): OrderTimelineEntry[] {
  if (history && history.length > 0) {
    return history.map((event, index) => ({
      status: event.status,
      label: statusLabel(event.status),
      at: event.at,
      isCurrent: index === history.length - 1,
    }));
  }

  if (status === "rejected") {
    return [{ status, label: statusLabel(status), at: null, isCurrent: true }];
  }

  const flow = ORDER_STATUS_FLOW as readonly string[];
  const reached = flow.indexOf(status) === -1 ? [status] : flow.slice(0, flow.indexOf(status) + 1);
  return reached.map((step) => ({
    status: step,
    label: statusLabel(step),
    at: null,
    isCurrent: step === status,
  }));
}
