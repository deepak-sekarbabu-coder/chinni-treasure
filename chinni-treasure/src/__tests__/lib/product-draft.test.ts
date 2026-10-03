import { describe, it, expect } from "vitest";
import {
  EMPTY_PRODUCT_DRAFT,
  draftFromProduct,
  productDraftPayload,
  validateProductDraft,
} from "@/src/lib/product-draft";

const product = {
  id: "p1",
  name: "Silk Scarf",
  sku: "SS-1",
  description: "desc",
  price: 599.5,
  compareAtPrice: 899,
  stockQuantity: 4,
  imageUrl: "/a.jpg",
  badge: "premium",
  categoryId: 3,
  isActive: true,
  allowGiftBoxBundling: true,
  visibleHostnames: "a.com",
  images: [{ url: "/b.jpg", isPrimary: true, displayOrder: 0 }],
};

describe("product-draft", () => {
  it("round-trips a product through the form and back to a payload", () => {
    const payload = productDraftPayload(draftFromProduct(product));

    expect(payload).toMatchObject({
      name: "Silk Scarf",
      sku: "SS-1",
      price: 599.5,
      compareAtPrice: 899,
      stockQuantity: 4,
      badge: "premium",
      categoryId: 3,
      allowGiftBoxBundling: true,
    });
  });

  it("falls back to the blank draft for an unrecognised badge", () => {
    const draft = draftFromProduct({ ...product, badge: "not-a-badge" });
    expect(draft.badge).toBe("");
    expect(EMPTY_PRODUCT_DRAFT.badge).toBe("");
  });

  // A cleared gallery must reach the server as `[]`, never undefined: the
  // update contract reads undefined as "untouched" and would keep the rows.
  it("sends an empty array, not undefined, for a cleared gallery", () => {
    const payload = productDraftPayload({ ...EMPTY_PRODUCT_DRAFT, name: "X", price: "10" });
    expect(payload.images).toEqual([]);
  });

  // The bug this module exists to prevent: the controller used to return two
  // different strings for the same "price must be positive" rule.
  it("returns one stable message per invalid field", () => {
    expect(validateProductDraft({ ...EMPTY_PRODUCT_DRAFT, name: "  " })).toBe(
      "Product name is required",
    );
    expect(validateProductDraft({ ...EMPTY_PRODUCT_DRAFT, name: "X", price: "0" })).toBe(
      "Price must be greater than zero",
    );
    expect(validateProductDraft({ ...EMPTY_PRODUCT_DRAFT, name: "X", price: "10" })).toBeNull();
  });
});