import { describe, it, expect } from "vitest";
import { toOrderView, orderTimeline } from "../../lib/order-view";

type OrderRecord = Parameters<typeof toOrderView>[0];

function record(overrides: Record<string, unknown> = {}): OrderRecord {
  return {
    id: "order-1",
    orderNumber: "ORD-1",
    status: "shipped",
    trackingId: "TRACK-1",
    transactionId: "txn_1",
    customerName: "Jane Doe",
    customerEmail: "jane@example.com",
    customerPhone: "9876543210",
    addressLine1: "123 Main St",
    addressLine2: null,
    city: "Mumbai",
    stateCode: "MH",
    postalCode: "400001",
    countryCode: "IN",
    customerNotes: null,
    subtotal: 2799,
    shippingCost: 200,
    totalAmount: 2999,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    items: [
      { id: "item-1", productName: "Silk Saree", unitPrice: 2499, quantity: 1, parentOrderItemId: null },
      { id: "item-2", productName: "Gift Box", unitPrice: 300, quantity: 1, parentOrderItemId: "item-1" },
    ],
    statusHistory: [],
    ...overrides,
  } as unknown as OrderRecord;
}

describe("toOrderView", () => {
  it("carries the money fields the order surfaces render", () => {
    const view = toOrderView(record());
    expect(view.subtotal).toBe(2799);
    expect(view.shippingCost).toBe(200);
    expect(view.totalAmount).toBe(2999);
  });

  it("keeps the gift-box parent link so order lines nest", () => {
    const view = toOrderView(record());
    expect(view.items[1].parentOrderItemId).toBe("item-1");
  });

  it("coerces decimal money and dates to JSON-safe values", () => {
    const view = toOrderView(
      record({ subtotal: "2799.00", shippingCost: "200.00", totalAmount: "2999.00" }),
    );
    expect(view.subtotal).toBe(2799);
    expect(view.shippingCost).toBe(200);
    expect(view.totalAmount).toBe(2999);
    expect(view.createdAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("sums item quantities into itemCount", () => {
    const view = toOrderView(record());
    expect(view.itemCount).toBe(2);
  });

  it("orders the status history oldest first", () => {
    const view = toOrderView(
      record({
        statusHistory: [
          { status: "shipped", notes: null, createdAt: new Date("2026-01-03T00:00:00.000Z") },
          { status: "pending", notes: "Order placed", createdAt: new Date("2026-01-01T00:00:00.000Z") },
        ],
      }),
    );
    expect(view.statusHistory.map((e) => e.status)).toEqual(["pending", "shipped"]);
  });

  it("never leaks admin notes into the view", () => {
    const view = toOrderView(
      record({
        statusHistory: [{ status: "pending", notes: "internal note", createdAt: new Date("2026-01-01T00:00:00.000Z") }],
      }),
    );
    expect(view.statusHistory[0]).toEqual({ status: "pending", at: "2026-01-01T00:00:00.000Z" });
  });
});

describe("orderTimeline", () => {
  it("projects the persisted sequence when history exists", () => {
    const entries = orderTimeline("shipped", [
      { status: "pending", at: "2026-01-01T00:00:00.000Z" },
      { status: "approved", at: "2026-01-02T00:00:00.000Z" },
      { status: "shipped", at: "2026-01-03T00:00:00.000Z" },
    ]);
    expect(entries.map((e) => e.status)).toEqual(["pending", "approved", "shipped"]);
    expect(entries.map((e) => e.label)).toEqual(["Pending", "Approved", "Shipped"]);
    expect(entries[2].isCurrent).toBe(true);
    expect(entries[0].at).toBe("2026-01-01T00:00:00.000Z");
  });

  it("falls back to the forward flow when no history is available", () => {
    const entries = orderTimeline("packaging");
    expect(entries.map((e) => e.status)).toEqual(["pending", "approved", "packaging"]);
    expect(entries[2].isCurrent).toBe(true);
    expect(entries[0].at).toBeNull();
  });

  it("falls back to a single rejected step", () => {
    const entries = orderTimeline("rejected");
    expect(entries).toHaveLength(1);
    expect(entries[0].status).toBe("rejected");
    expect(entries[0].isCurrent).toBe(true);
  });

  it("labels an unknown status with the raw value", () => {
    expect(orderTimeline("mystery")[0].label).toBe("mystery");
  });
});
