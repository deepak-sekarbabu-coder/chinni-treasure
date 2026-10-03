import { describe, expect, it } from "vitest";
import { buildWorkbook } from "../../lib/excel-export";
import { sheetRows } from "@/src/lib/sheet-rows";

/**
 * The seed round trip is export → workbook → import. `buildWorkbook` declares
 * every column as a `ColumnDef.header`; the importer reads by those headers
 * through the shared `sheetRows`. This pins the two sides together: the importer
 * used to read by cell index, with fallbacks guessed from neighbouring columns,
 * and had already drifted out of step with the exporter's column order.
 *
 * `sheetRows` is imported, not copied — this test used to carry its own
 * re-implementation, which meant changing the real decoder left it green.
 */

const data = {
  categories: [
    { id: 7, name: "Gifts", slug: "gifts", description: null, displayOrder: 1, isActive: true, createdAt: new Date("2026-01-02T03:04:05Z"), updatedAt: new Date("2026-01-02T03:04:05Z") },
  ],
  products: [
    {
      id: "p1", sku: "SKU-1", name: "Box", categoryId: 7, category: { name: "Gifts" },
      description: null, price: 12.5, compareAtPrice: 15, stockQuantity: 10,
      imageUrl: "https://cdn.test/a.jpg", badge: "premium", isActive: true,
      allowGiftBoxBundling: true, visibleHostnames: "chinni.test",
      deletedAt: null, createdAt: new Date("2026-01-02T03:04:05Z"), updatedAt: new Date("2026-01-02T03:04:05Z"),
    },
  ],
  productImages: [
    { id: "img1", productId: "p1", url: "https://cdn.test/a.jpg", isPrimary: true, displayOrder: 0, createdAt: new Date("2026-01-02T03:04:05Z") },
  ],
  orders: [
    {
      id: "o1", orderNumber: "ORD-1", customerName: "A", customerEmail: "a@b.c",
      customerPhone: "9999999999", addressLine1: "X", addressLine2: null, city: "C",
      stateCode: "KA", postalCode: "560001", countryCode: "IN", status: "pending",
      trackingId: null, subtotal: 100, shippingCost: 0, totalAmount: 100,
      transactionId: null, customerNotes: null, adminNotes: null, version: 4,
      createdAt: new Date("2026-01-02T03:04:05Z"), updatedAt: new Date("2026-01-02T03:04:05Z"),
    },
  ],
  orderItems: [
    { id: "i1", orderId: "o1", order: { orderNumber: "ORD-1" }, productId: "p1", productName: "Box", unitPrice: 12.5, quantity: 2, parentOrderItemId: null, createdAt: new Date("2026-01-02T03:04:05Z") },
  ],
  statusHistory: [
    { id: "h1", orderId: "o1", order: { orderNumber: "ORD-1" }, status: "pending", notes: null, createdAt: new Date("2026-01-02T03:04:05Z") },
  ],
  admins: [
    { id: "a1", username: "admin", email: "admin@ct.in", role: "admin", isActive: true, lastLoginAt: null, createdAt: new Date("2026-01-02T03:04:05Z"), updatedAt: new Date("2026-01-02T03:04:05Z") },
  ],
};

describe("seed round trip", () => {
  const wb = buildWorkbook(data);

  it("reads a product back by header, not by position", () => {
    const [product] = sheetRows(wb, "Products");
    // Every field the importer projects, resolved by the exporter's own header.
    expect(product.sku).toBe("SKU-1");
    expect(product.name).toBe("Box");
    expect(product["category id"]).toBe(7);
    // Money columns are Prisma Decimals, exported via formatDecimal — the importer
    // runs every numeric cell through parseNum.
    expect(product.price).toBe("12.5");
    expect(product["compare at price"]).toBe("15");
    expect(product["stock quantity"]).toBe(10);
    expect(product.badge).toBe("premium");
    expect(product["allow gift box bundling"]).toBe("Yes");
    expect(product["visible hostnames"]).toBe("chinni.test");
  });

  it("reads categories, orders, items, history and admins back by header", () => {
    expect(sheetRows(wb, "Categories")[0]).toMatchObject({ slug: "gifts", "display order": 1 });
    expect(sheetRows(wb, "Orders")[0]).toMatchObject({ "order number": "ORD-1", status: "pending", version: 4 });
    expect(sheetRows(wb, "Order Items")[0]).toMatchObject({ id: "i1", "order id": "o1", quantity: 2 });
    expect(sheetRows(wb, "Order Status History")[0]).toMatchObject({ "order id": "o1", status: "pending" });
    expect(sheetRows(wb, "Admins")[0]).toMatchObject({ username: "admin", role: "admin" });
  });

  it("keeps the primary image first so the seeder's gallery order is stable", () => {
    const images = sheetRows(wb, "Product Images");
    expect(images[0]).toMatchObject({ "product id": "p1", url: "https://cdn.test/a.jpg", "display order": 0 });
    expect(images[0]["is primary"]).toBe("Yes");
  });

  // The guard the copied decoder could not give: every header the importer
  // projects by name is a header the exporter actually writes. A renamed or
  // dropped column now fails here instead of silently importing `undefined`.
  it("gives every header the importer reads a header the exporter writes", () => {
    const written = new Set<string>();
    wb.eachSheet((sheet) => {
      sheet.getRow(1).eachCell((cell) => {
        const header = String(cell.value ?? "").toLowerCase().trim();
        if (header) written.add(`${sheet.name}:${header}`);
      });
    });

    // The header literals `scripts/generate-seed-from-excel.ts` reads.
    const read: Array<[string, string[]]> = [
      ["Products", ["sku", "name", "category id", "description", "price", "compare at price",
        "stock quantity", "image url", "badge", "is active", "allow gift box bundling",
        "visible hostnames", "deleted at"]],
      ["Categories", ["id", "name", "slug", "description", "display order", "is active"]],
      ["Product Images", ["id", "product id", "url", "is primary", "display order"]],
      ["Orders", ["id", "order number", "customer name", "customer email", "customer phone",
        "address line 1", "address line 2", "city", "state code", "postal code",
        "country code", "status", "tracking id", "subtotal", "shipping cost",
        "total amount", "transaction id", "customer notes", "admin notes", "version"]],
      ["Order Items", ["id", "order id", "order number", "product id", "product name",
        "unit price", "quantity", "parent order item id"]],
      ["Order Status History", ["id", "order id", "order number", "status", "notes"]],
      ["Admins", ["id", "username", "email", "role", "is active", "last login at"]],
    ];

    for (const [sheet, headers] of read) {
      for (const header of headers) {
        expect(written.has(`${sheet}:${header}`), `${sheet} is missing a "${header}" column`).toBe(true);
      }
    }
  });
});