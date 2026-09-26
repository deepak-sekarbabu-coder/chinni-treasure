import { describe, it, expect } from "vitest";
import {
  cartItemsToWire,
  cartPricedLines,
  cartOrderItems,
  cartSchema,
  CART_COOKIE,
  CART_MAX_AGE,
} from "../../lib/cart-projections";

describe("cart wire projection", () => {
  it("strips surprise gifts and reduces gift boxes to ids", () => {
    const wire = cartItemsToWire([
      { productId: "p1", quantity: 2, giftBoxes: [{ productId: "box1", quantity: 1 }] },
      { productId: "__surprise_gift__", quantity: 1, isGift: true },
      { productId: "p2", quantity: 1 },
    ]);
    expect(wire).toEqual([
      { productId: "p1", quantity: 2, giftBoxes: [{ productId: "box1", quantity: 1 }] },
      { productId: "p2", quantity: 1 },
    ]);
  });

  it("round-trips through the wire schema the server parses", () => {
    const wire = cartItemsToWire([
      {
        productId: "11111111-1111-4111-8111-111111111111",
        quantity: 3,
        giftBoxes: [{ productId: "22222222-2222-4222-8222-222222222222", quantity: 2 }],
      },
      { productId: "33333333-3333-4333-8333-333333333333", quantity: 1 },
    ]);
    const parsed = cartSchema.safeParse(wire);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data).toHaveLength(2);
  });

  it("rejects malformed wire shapes", () => {
    expect(cartSchema.safeParse([{ productId: "not-a-uuid", quantity: 1 }]).success).toBe(false);
    expect(
      cartSchema.safeParse([
        { productId: "11111111-1111-1111-1111-111111111111", quantity: 0 },
      ]).success,
    ).toBe(false);
  });

  it("defines the cookie name and lifetime once", () => {
    expect(CART_COOKIE).toBe("cart");
    expect(CART_MAX_AGE).toBe(2592000);
  });
});

describe("cart priced-lines projection", () => {
  it("flattens each parent line before its gift-box lines and carries the parent sku", () => {
    const lines = cartPricedLines([
      {
        productId: "p1",
        quantity: 2,
        price: 100,
        sku: "SKU-1",
        giftBoxes: [
          { productId: "box1", price: 25, quantity: 1 },
          { productId: "box2", price: 40, quantity: 2 },
        ],
      },
      { productId: "p2", quantity: 1, price: 350 },
    ]);
    expect(lines).toEqual([
      { price: 100, quantity: 2, sku: "SKU-1" },
      { price: 25, quantity: 1 },
      { price: 40, quantity: 2 },
      { price: 350, quantity: 1, sku: undefined },
    ]);
  });

  it("excludes the free surprise gift from the money projection", () => {
    const lines = cartPricedLines([
      { productId: "p1", quantity: 1, price: 100 },
      { productId: "__surprise_gift__", quantity: 1, price: 0, isGift: true },
    ]);
    expect(lines).toEqual([{ price: 100, quantity: 1, sku: undefined }]);
  });
});

describe("cart order-items projection", () => {
  it("projects the intake payload shape with id keys and gift-box ids", () => {
    expect(
      cartOrderItems([
        {
          productId: "p1",
          quantity: 2,
          price: 100,
          giftBoxes: [{ productId: "box1", price: 25, quantity: 1 }],
        },
        { productId: "__surprise_gift__", quantity: 1, price: 0, isGift: true },
        { productId: "p2", quantity: 1, price: 350 },
      ]),
    ).toEqual([
      { id: "p1", quantity: 2, giftBoxes: [{ id: "box1", quantity: 1 }] },
      { id: "p2", quantity: 1, giftBoxes: undefined },
    ]);
  });

  it("agrees with the money projection on which parents are billable", () => {
    const items = [
      { productId: "p1", quantity: 3, price: 10 },
      { productId: "gift", quantity: 1, price: 0, isGift: true },
      { productId: "p2", quantity: 1, price: 5 },
    ];
    const pricedIds = cartPricedLines(items).map((l) => l.quantity);
    const payloadIds = cartOrderItems(items).map((l) => l.quantity);
    expect(payloadIds).toEqual(pricedIds);
  });
});
