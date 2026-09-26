import { describe, it, expect } from "vitest";
import {
  CreateCategorySchema,
  UpdateCategorySchema,
  CategoryDetailSchema,
  LatestCategorySectionSchema,
  CategoryProductsResponseSchema,
} from "@/src/lib/api/schemas";

describe("CreateCategorySchema", () => {
  it("requires a name and accepts optional fields", () => {
    const parsed = CreateCategorySchema.parse({ name: "Rings" });
    expect(parsed.name).toBe("Rings");
  });

  it("rejects empty name", () => {
    expect(() => CreateCategorySchema.parse({ name: "" })).toThrow();
  });

  it("rejects invalid slug (not kebab-case)", () => {
    expect(() =>
      CreateCategorySchema.parse({ name: "Rings", slug: "Bad Slug" }),
    ).toThrow();
  });

  it("accepts valid kebab-case slug", () => {
    const parsed = CreateCategorySchema.parse({ name: "Rings", slug: "gold-rings" });
    expect(parsed.slug).toBe("gold-rings");
  });
});

describe("UpdateCategorySchema", () => {
  it("allows partial updates", () => {
    const parsed = UpdateCategorySchema.parse({ isActive: false });
    expect(parsed.isActive).toBe(false);
  });

  it("rejects invalid slug", () => {
    expect(() => UpdateCategorySchema.parse({ slug: "X Y" })).toThrow();
  });
});

describe("CategoryDetailSchema", () => {
  it("parses a full category", () => {
    const parsed = CategoryDetailSchema.parse({
      id: 1,
      name: "Rings",
      slug: "rings",
      description: "All rings",
      displayOrder: 2,
      isActive: true,
      productCount: 5,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
    });
    expect(parsed.id).toBe(1);
    expect(parsed.productCount).toBe(5);
  });
});

describe("LatestCategorySectionSchema", () => {
  it("parses category + product envelope", () => {
    const parsed = LatestCategorySectionSchema.parse({
      category: { id: 1, name: "Rings", slug: "rings" },
      product: {
        id: "p1",
        name: "Gold Ring",
        price: 100,
        imageUrl: "/g.jpg",
        description: "Pretty",
        stockQuantity: 3,
        badge: null,
      },
    });
    expect(parsed.category.slug).toBe("rings");
    expect(parsed.product.price).toBe(100);
  });
});

describe("CategoryProductsResponseSchema", () => {
  it("parses paginated response", () => {
    const parsed = CategoryProductsResponseSchema.parse({
      category: { id: 1, name: "Rings", slug: "rings", displayOrder: 1, isActive: true },
      products: [],
      total: 0,
      page: 1,
      limit: 12,
      totalPages: 1,
    });
    expect(parsed.totalPages).toBe(1);
  });
});
