import { describe, it, expect } from "vitest";
import { computePricing, FREE_SHIPPING_THRESHOLD, orderLineViews, shippingProgress } from "../../lib/pricing";

describe("FREE_SHIPPING_THRESHOLD", () => {
  it("is 599", () => {
    expect(FREE_SHIPPING_THRESHOLD).toBe(599);
  });
});

describe("computePricing", () => {
  const tn = "TN";
  const ka = "KA";

  it("computes subtotal as sum of price × quantity across all lines", () => {
    const result = computePricing(
      [
        { price: 300, quantity: 2 },
        { price: 150, quantity: 1 },
      ],
      ka,
    );
    expect(result.subtotal).toBe(750);
  });

  it("includes gift-box lines in the subtotal", () => {
    const result = computePricing(
      [
        { price: 400, quantity: 1 },
        { price: 120, quantity: 2, sku: "GB-001" },
      ],
      ka,
    );
    expect(result.subtotal).toBe(640);
  });

  it("returns free shipping when subtotal >= 599", () => {
    const result = computePricing([{ price: 600, quantity: 1 }], ka);
    expect(result.shippingCost).toBe(0);
    expect(result.totalAmount).toBe(600);
  });

  it("returns free shipping at exactly the threshold", () => {
    const result = computePricing([{ price: 599, quantity: 1 }], ka);
    expect(result.shippingCost).toBe(0);
  });

  it("charges shipping when subtotal is below the threshold", () => {
    const result = computePricing([{ price: 500, quantity: 1 }], ka);
    expect(result.shippingCost).toBe(200);
    expect(result.totalAmount).toBe(700);
  });

  it("charges ₹150 for Tamil Nadu addresses below threshold", () => {
    const result = computePricing([{ price: 500, quantity: 1 }], tn);
    expect(result.shippingCost).toBe(150);
    expect(result.totalAmount).toBe(650);
  });

  it("charges ₹200 for non-TN addresses below threshold", () => {
    const result = computePricing([{ price: 400, quantity: 1 }], "MH");
    expect(result.shippingCost).toBe(200);
    expect(result.totalAmount).toBe(600);
  });

  it("returns free shipping when any line has sku 0000", () => {
    const result = computePricing(
      [
        { price: 100, quantity: 1 },
        { price: 200, quantity: 1, sku: "0000" },
      ],
      ka,
    );
    expect(result.shippingCost).toBe(0);
    expect(result.totalAmount).toBe(300);
  });

  it("applies the shipping policy to an empty lines array", () => {
    const result = computePricing([], tn);
    expect(result.subtotal).toBe(0);
    expect(result.shippingCost).toBe(150);
    expect(result.totalAmount).toBe(150);
  });

  it("totalAmount equals subtotal + shippingCost", () => {
    const result = computePricing(
      [{ price: 250, quantity: 2 }],
      "DL",
    );
    expect(result.totalAmount).toBe(result.subtotal + result.shippingCost);
  });

  it("free-shipping threshold applies to gift-box-inclusive subtotal", () => {
    const result = computePricing(
      [
        { price: 400, quantity: 1 },
        { price: 200, quantity: 1, sku: "GB-001" },
      ],
      ka,
    );
    expect(result.subtotal).toBe(600);
    expect(result.shippingCost).toBe(0);
  });
});

describe("shippingProgress", () => {
  it("reads zero remaining and full progress at the threshold", () => {
    expect(shippingProgress(599)).toEqual({ remaining: 0, percent: 100, unlocked: true });
  });

  it("clamps below the threshold to 0% and exposes the shortfall", () => {
    expect(shippingProgress(0)).toEqual({ remaining: 599, percent: 0, unlocked: false });
    const mid = shippingProgress(200);
    expect(mid.remaining).toBe(399);
    expect(mid.percent).toBeGreaterThan(0);
    expect(mid.percent).toBeLessThan(100);
    expect(mid.unlocked).toBe(false);
  });

  it("clamps above the threshold to 100% and unlocks", () => {
    expect(shippingProgress(1200)).toEqual({ remaining: 0, percent: 100, unlocked: true });
  });
});

describe("orderLineViews", () => {
  it("flattens parents with their gift boxes in render order", () => {
    const rows = orderLineViews([
      { id: "p1", productName: "Ring", quantity: 1, unitPrice: 100, parentOrderItemId: null },
      { id: "g1", productName: "Box", quantity: 2, unitPrice: 50, parentOrderItemId: "p1" },
      { id: "p2", productName: "Bangle", quantity: 1, unitPrice: 200, parentOrderItemId: null },
      { id: "g2", productName: "Wrap", quantity: 1, unitPrice: 25, parentOrderItemId: "p1" },
    ]);

    expect(rows.map((r) => r.id)).toEqual(["p1", "g1", "g2", "p2"]);
    expect(rows[0]).toMatchObject({ parentId: null, lineTotal: 100 });
    expect(rows[1]).toMatchObject({ parentId: "p1", unitPrice: 50, lineTotal: 100 });
    expect(rows[3]).toMatchObject({ parentId: null, lineTotal: 200 });
  });

  it("drops gift-box lines whose parent is missing", () => {
    const rows = orderLineViews([
      { id: "orphan", productName: "Box", quantity: 1, unitPrice: 50, parentOrderItemId: "gone" },
      { id: "p", productName: "Ring", quantity: 1, unitPrice: 100, parentOrderItemId: null },
    ]);

    expect(rows.map((r) => r.id)).toEqual(["p"]);
  });
});
