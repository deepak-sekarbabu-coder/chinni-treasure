import { describe, expect, it } from "vitest";
import { buildWorkbook } from "../../lib/excel-export";

const base = {
  categories: [{ id: 1, name: "Gifts", slug: "gifts", description: "", displayOrder: 1, isActive: true, createdAt: new Date("2026-01-02T03:04:05Z"), updatedAt: new Date("2026-01-02T03:04:05Z") }],
  products: [{ id: "p1", sku: "SKU-1", name: "Box", categoryId: 1, category: { name: "Gifts" }, description: "", price: 12.5, compareAtPrice: 15, stockQuantity: 10, imageUrl: null, badge: null, isActive: true, allowGiftBoxBundling: true, visibleHostnames: "chinni.test", deletedAt: new Date("2026-07-24T03:21:12.646Z"), createdAt: new Date("2026-01-02T03:04:05Z"), updatedAt: new Date("2026-01-02T03:04:05Z") }],
  productImages: [],
  orders: [{ id: "o1", orderNumber: "ORD-1", customerName: "A", customerEmail: "a@b.c", customerPhone: "9999999999", addressLine1: "X", addressLine2: null, city: "C", stateCode: "KA", postalCode: "560001", countryCode: "IN", status: "pending", trackingId: null, subtotal: 100, shippingCost: 0, totalAmount: 100, transactionId: null, customerNotes: null, adminNotes: null, version: 4, createdAt: new Date("2026-01-02T03:04:05Z"), updatedAt: new Date("2026-01-02T03:04:05Z") }],
  orderItems: [{ id: "i1", orderId: "o1", order: { orderNumber: "ORD-1" }, productId: "p1", productName: "Box", unitPrice: 12.5, quantity: 2, parentOrderItemId: "ip", createdAt: new Date("2026-01-02T03:04:05Z") }],
  statusHistory: [{ id: "h1", orderId: "o1", order: { orderNumber: "ORD-1" }, status: "pending", notes: null, createdAt: new Date("2026-01-02T03:04:05Z") }],
  admins: [{ id: "a1", username: "admin", email: "admin@ct.in", role: "admin", isActive: true, lastLoginAt: null, createdAt: new Date("2026-01-02T03:04:05Z"), updatedAt: new Date("2026-01-02T03:04:05Z") }],
};

describe("buildWorkbook", () => {
  it("exports the full column set the seed pipeline reads back", () => {
    const wb = buildWorkbook(base);
    const row1BySheet = (name: string) => wb.getWorksheet(name)!.getRow(1);

    const products = row1BySheet("Products");
    expect(products.getCell(13).value).toBe("Allow Gift Box Bundling");
    expect(products.getCell(14).value).toBe("Visible Hostnames");
    expect(products.getCell(15).value).toBe("Deleted At");

    const orders = row1BySheet("Orders");
    expect(orders.getCell(20).value).toBe("Version");

    const items = row1BySheet("Order Items");
    expect(items.getCell(3).value).toBe("Order Number");
    expect(items.getCell(8).value).toBe("Parent Order Item ID");

    const history = row1BySheet("Order Status History");
    expect(history.getCell(3).value).toBe("Order Number");
  });

  it("formats dates, booleans, and version consistently", () => {
    const wb = buildWorkbook(base);

    const products = wb.getWorksheet("Products")!.getRow(2);
    expect(products.getCell(13).value).toBe("Yes");
    expect(products.getCell(14).value).toBe("chinni.test");
    expect(products.getCell(15).value).toBe("2026-07-24T03:21:12.646Z");

    const orders = wb.getWorksheet("Orders")!.getRow(2);
    expect(orders.getCell(20).value).toBe(4);
    expect(orders.getCell(21).value).toBe("2026-01-02T03:04:05.000Z");

    const items = wb.getWorksheet("Order Items")!.getRow(2);
    expect(items.getCell(3).value).toBe("ORD-1");
    expect(items.getCell(8).value).toBe("ip");
  });
});