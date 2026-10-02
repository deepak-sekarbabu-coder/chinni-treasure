import { describe, it, expect } from "vitest";
import {
  canBundleGiftBoxes,
  GIFT_BOX_CATEGORY_SLUG,
  GIFT_BOX_CATEGORY_WHERE,
  isGiftBoxCategory,
} from "@/src/lib/gift-box";

describe("gift-box rule", () => {
  it("names one identity: the slug, never the display name", () => {
    expect(GIFT_BOX_CATEGORY_SLUG).toBe("box");
    expect(GIFT_BOX_CATEGORY_WHERE).toEqual({ slug: "box" });
    expect(isGiftBoxCategory({ slug: "box" })).toBe(true);
    // The second vocabulary is gone: a category *named* "Gift Boxes" with any
    // other slug is not the gift-box category, and the storefront now reads
    // this same answer instead of the label.
    expect(isGiftBoxCategory({ name: "Gift Boxes", slug: "gift-boxes" } as never)).toBe(false);
  });

  it("treats a missing category as not-the-gift-box-category", () => {
    expect(isGiftBoxCategory(null)).toBe(false);
    expect(isGiftBoxCategory(undefined)).toBe(false);
    expect(isGiftBoxCategory({})).toBe(false);
  });

  it("bundles only when the product opts in and is not itself a gift box", () => {
    const box = { slug: "box" };
    const other = { slug: "bangles" };
    expect(canBundleGiftBoxes({ allowGiftBoxBundling: true, category: other })).toBe(true);
    expect(canBundleGiftBoxes({ allowGiftBoxBundling: true, category: box })).toBe(false);
    expect(canBundleGiftBoxes({ allowGiftBoxBundling: false, category: other })).toBe(false);
    expect(canBundleGiftBoxes({ allowGiftBoxBundling: true })).toBe(true);
  });
});
