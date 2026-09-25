import { describe, it, expect } from "vitest";
import { cartItemsToWire, cartSchema, CART_COOKIE, CART_MAX_AGE } from "../../lib/cart-wire";

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