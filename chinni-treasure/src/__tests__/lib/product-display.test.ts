import { describe, it, expect } from "vitest";
import {
  productDisplayView,
  primaryImage,
  stockHealth,
  LOW_STOCK_MAX,
} from "../../lib/product-display";
import { IMAGE_UNAVAILABLE_PLACEHOLDER } from "../../lib/images";

const base = {
  price: 100,
  stockQuantity: 10,
  imageUrl: null as string | null,
};

describe("stockHealth", () => {
  it("is out at 0 and below", () => {
    expect(stockHealth(0)).toBe("out");
    expect(stockHealth(-1)).toBe("out");
  });

  it("is low through the shared ≤3 threshold", () => {
    expect(LOW_STOCK_MAX).toBe(3);
    expect(stockHealth(1)).toBe("low");
    expect(stockHealth(3)).toBe("low");
  });

  it("is in from 4 up (detail page's old ≤5 drift is gone)", () => {
    expect(stockHealth(4)).toBe("in");
    expect(stockHealth(5)).toBe("in");
    expect(stockHealth(999)).toBe("in");
  });
});

describe("primaryImage", () => {
  it("picks the primary gallery image", () => {
    expect(
      primaryImage({
        imageUrl: "/single.jpg",
        images: [
          { url: "/a.jpg", isPrimary: false },
          { url: "/b.jpg", isPrimary: true },
        ],
      }),
    ).toBe("/b.jpg");
  });

  it("falls back to imageUrl when no primary", () => {
    expect(
      primaryImage({ imageUrl: "/single.jpg", images: [{ url: "/a.jpg", isPrimary: false }] }),
    ).toBe("/single.jpg");
    expect(primaryImage({ imageUrl: "/single.jpg" })).toBe("/single.jpg");
  });

  it("falls back to the shared placeholder when there is nothing", () => {
    expect(primaryImage({ imageUrl: null })).toBe(IMAGE_UNAVAILABLE_PLACEHOLDER);
    expect(primaryImage({ imageUrl: null, images: [] })).toBe(IMAGE_UNAVAILABLE_PLACEHOLDER);
  });
});

describe("productDisplayView", () => {
  it("exposes price, stock, and image from one contract", () => {
    const view = productDisplayView({
      ...base,
      stockQuantity: 2,
      imageUrl: "/x.jpg",
      badge: "Bestseller",
    });
    expect(view.price).toBe(100);
    expect(view.stock).toBe("low");
    expect(view.image).toBe("/x.jpg");
    expect(view.badge).toBe("Bestseller");
    expect(view.badgeClass).toBe("badge-bestseller");
  });

  it("computes discount percent only when compare exceeds price", () => {
    expect(productDisplayView({ ...base, compareAtPrice: 200 }).discountPercent).toBe(50);
    expect(productDisplayView({ ...base, compareAtPrice: 99 }).hasDiscount).toBe(false);
    expect(productDisplayView({ ...base, compareAtPrice: 99 }).discountPercent).toBe(0);
    expect(productDisplayView({ ...base, compareAtPrice: 100 }).hasDiscount).toBe(false);
  });

  it("treats missing/zero compareAtPrice as no discount", () => {
    const view = productDisplayView({ ...base, compareAtPrice: null });
    expect(view.hasDiscount).toBe(false);
    expect(view.compareAtPrice).toBeNull();
  });

  it("handles non-numeric price input like the old Number() coercion", () => {
    const view = productDisplayView({ ...base, price: Number("") });
    expect(view.price).toBe(0);
    expect(view.hasDiscount).toBe(false);
  });

  it("rounds discount percent", () => {
    // 149.99 compare vs 100 price → 33.33…% → 33
    expect(productDisplayView({ ...base, compareAtPrice: 149.99 }).discountPercent).toBe(33);
  });
});
