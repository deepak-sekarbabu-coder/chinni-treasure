import { describe, it, expect } from "vitest";
import { generateInvoice, type OrderData } from "../../lib/pdf-documents";

const order: OrderData = {
  orderNumber: "CH20260101",
  customerName: "Test User",
  customerEmail: "test@example.com",
  customerPhone: "9876543210",
  addressLine1: "10 Test Street",
  addressLine2: null,
  city: "Chennai",
  stateCode: "TN",
  postalCode: "600001",
  subtotal: 800,
  shippingCost: 0,
  totalAmount: 800,
  transactionId: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  items: [
    { id: "p1", productName: "Gold Ring", unitPrice: 500, quantity: 1, parentOrderItemId: null },
    { id: "g1", productName: "Gift Box", unitPrice: 50, quantity: 2, parentOrderItemId: "p1" },
    { id: "p2", productName: "Silver Bangle", unitPrice: 300, quantity: 1, parentOrderItemId: null },
  ],
};

function pageContent(doc: { internal: { pages: string[][] } }): string {
  return doc.internal.pages.map((p) => p.join("\n")).join("\n");
}

describe("generateInvoice", () => {
  it("produces a valid PDF", async () => {
    const doc = await generateInvoice(order);
    const bytes = new Uint8Array(doc.output("arraybuffer"));
    expect(Array.from(bytes.slice(0, 4))).toEqual([37, 80, 68, 70]);
    expect(doc.getNumberOfPages()).toBe(1);
  });

  it("renders order, customer and totals details", async () => {
    const doc = await generateInvoice(order);
    const content = pageContent(doc);
    expect(content).toContain("CH20260101");
    expect(content).toContain("Test User");
    expect(content).toContain("Chennai");
    expect(content).toContain("INR 800.00");
  });

  it("renders gift-box lines nested under their parent", async () => {
    const doc = await generateInvoice(order);
    const content = pageContent(doc);
    expect(content).toContain("Gold Ring");
    expect(content).toContain("Gift box");
    expect(content).toContain("Silver Bangle");
  });

  it("shows Free instead of a shipping figure when shippingCost is 0", async () => {
    const doc = await generateInvoice(order);
    const content = pageContent(doc);
    expect(content).toContain("Free");
  });
});