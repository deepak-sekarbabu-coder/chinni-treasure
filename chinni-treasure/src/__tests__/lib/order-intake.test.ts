import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockPrisma, mockTx } from "@/src/__tests__/mocks/prisma";
import { Prisma } from "@prisma/client";
import type { CreateOrderInput } from "@/src/lib/order-intake";

vi.mock("@/src/lib/prisma", () => ({ prisma: createMockPrisma() }));

import { placeOrder, parseCreateOrderInput, assertPaidAmountMatchesTotal, OrderError } from "@/src/lib/order-intake";
import { prisma } from "@/src/lib/prisma";

const mockProducts = [
  { id: "p1", name: "Product 1", price: new Prisma.Decimal(100), stockQuantity: 10, isActive: true, sku: null, categoryId: null, allowGiftBoxBundling: false, category: null },
  { id: "p2", name: "Product 2", price: new Prisma.Decimal(200), stockQuantity: 5, isActive: true, sku: null, categoryId: null, allowGiftBoxBundling: false, category: null },
];

const mockOrder = {
  id: "order-uuid",
  orderNumber: "ORD-TEST",
  customerName: "Test User",
  status: "pending",
  subtotal: 200,
  shippingCost: 200,
  totalAmount: 400,
  items: [
    { id: "item-1", productId: "p1", productName: "Product 1", unitPrice: 100, quantity: 2, orderId: "order-uuid", createdAt: new Date() },
  ],
};

const validInput: CreateOrderInput = {
  customerName: "Test User",
  customerEmail: "test@example.com",
  customerPhone: "9999999999",
  addressLine1: "123 Main St",
  city: "Mumbai",
  stateCode: "MH",
  postalCode: "400001",
  transactionId: "TXN001",
  paymentGateway: "razorpay",
  razorpayOrderId: "order_TEST123",
  items: [{ id: "p1", quantity: 2 }],
};

function withTx() {
  vi.mocked(prisma.$transaction).mockImplementation(
    async (cb: (tx: typeof mockTx) => unknown) => cb(mockTx),
  );
}

describe("parseCreateOrderInput", () => {
  it("accepts a valid placement intent", () => {
    expect(parseCreateOrderInput(validInput)).toMatchObject({ customerName: "Test User" });
  });

  it("rejects a 9-digit phone as OrderError/400", () => {
    expect(() =>
      parseCreateOrderInput({ ...validInput, customerPhone: "99999999" }),
    ).toThrowError(OrderError);
    try {
      parseCreateOrderInput({ ...validInput, customerPhone: "99999999" });
    } catch (err) {
      expect((err as OrderError).statusCode).toBe(400);
    }
  });

  it("rejects an empty items list", () => {
    expect(() => parseCreateOrderInput({ ...validInput, items: [] })).toThrowError(OrderError);
  });

  it("rejects an unknown state code", () => {
    expect(() => parseCreateOrderInput({ ...validInput, stateCode: "ZZ" })).toThrowError(OrderError);
  });
});

describe("placeOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("places an order through the interface — no HTTP harness", async () => {
    vi.mocked(mockTx.product.findMany).mockResolvedValue(mockProducts);
    vi.mocked(mockTx.order.create).mockResolvedValue(mockOrder);
    vi.mocked(mockTx.product.update).mockResolvedValue({ ...mockProducts[0], stockQuantity: 8 });
    withTx();

    const order = await placeOrder(validInput);

    expect(order).toBe(mockOrder);
    expect(mockTx.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ subtotal: 200, shippingCost: 200, totalAmount: 400 }),
      }),
    );
    expect(mockTx.product.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "p1" }, data: { stockQuantity: { decrement: 2 } } }),
    );
  });

  it("rejects a mismatched paid amount when resolvedPaidPaise is provided (ADR-0002)", async () => {
    vi.mocked(mockTx.product.findMany).mockResolvedValue(mockProducts);
    vi.mocked(mockTx.order.create).mockResolvedValue(mockOrder);
    withTx();

    // Server computes ₹400 total; gateway charged ₹500.00
    await expect(
      placeOrder(validInput, { resolvedPaidPaise: 50000 }),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringContaining("does not match the order total"),
    });
    expect(mockTx.order.create).not.toHaveBeenCalled();
  });

  it("accepts an exact paid amount and persists the order", async () => {
    vi.mocked(mockTx.product.findMany).mockResolvedValue(mockProducts);
    vi.mocked(mockTx.order.create).mockResolvedValue(mockOrder);
    vi.mocked(mockTx.product.update).mockResolvedValue({ ...mockProducts[0], stockQuantity: 8 });
    withTx();

    await expect(
      placeOrder(validInput, { resolvedPaidPaise: 40000 }),
    ).resolves.toBe(mockOrder);
  });

  it("skips the invariant when no resolved amount is given (manual placement path)", async () => {
    vi.mocked(mockTx.product.findMany).mockResolvedValue(mockProducts);
    vi.mocked(mockTx.order.create).mockResolvedValue(mockOrder);
    vi.mocked(mockTx.product.update).mockResolvedValue({ ...mockProducts[0], stockQuantity: 8 });
    withTx();

    await expect(placeOrder(validInput)).resolves.toBe(mockOrder);
  });

  it("maps unknown product to OrderError/404", async () => {
    vi.mocked(mockTx.product.findMany).mockResolvedValue([]);
    withTx();

    await expect(placeOrder(validInput)).rejects.toMatchObject({
      statusCode: 404,
      message: expect.stringContaining("not found"),
    });
  });

  it("maps insufficient stock to OrderError/400", async () => {
    vi.mocked(mockTx.product.findMany).mockResolvedValue([
      { ...mockProducts[0], stockQuantity: 1 },
    ]);
    withTx();

    await expect(placeOrder(validInput)).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringContaining("Insufficient stock"),
    });
  });

  it("rejects gift boxes when the parent does not support bundling", async () => {
    vi.mocked(mockTx.product.findMany).mockResolvedValue([
      { ...mockProducts[0], allowGiftBoxBundling: false },
      { ...mockProducts[1], category: { slug: "box" } },
    ]);
    withTx();

    const input: CreateOrderInput = {
      ...validInput,
      items: [{ id: "p1", quantity: 1, giftBoxes: [{ id: "p2", quantity: 1 }] }],
    };
    await expect(placeOrder(input)).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringContaining("does not support gift box bundling"),
    });
  });
});

describe("assertPaidAmountMatchesTotal (ADR-0002 invariant)", () => {
  it("passes when the paid paise equal the stored total", () => {
    expect(() => assertPaidAmountMatchesTotal(60000, 600)).not.toThrow();
  });

  it("throws OrderError/400 when the charged amount disagrees", () => {
    try {
      assertPaidAmountMatchesTotal(59999, 600);
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(OrderError);
      expect((err as OrderError).statusCode).toBe(400);
    }
  });

  it("handles rupee float rounding (₹599.50 → 59950 paise)", () => {
    expect(() => assertPaidAmountMatchesTotal(59950, 599.5)).not.toThrow();
  });
});
