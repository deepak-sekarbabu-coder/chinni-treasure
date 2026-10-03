import { vi, describe, it, expect, beforeEach } from "vitest";
import { createNextRequest } from "@/src/__tests__/utils/api-test";
import { createMockPrisma, mockTx } from "@/src/__tests__/mocks/prisma";
import { Prisma } from "@prisma/client";

vi.mock("@/src/lib/prisma", () => ({ prisma: createMockPrisma() }));
vi.mock("@/src/lib/order-cache", () => ({
  invalidateOrderCache: vi.fn().mockResolvedValue(undefined),
}));
// The route guard applies the rate limit; null == allowed.
vi.mock("@/src/lib/rate-limiter", () => ({
  guardRateLimit: vi.fn().mockResolvedValue(null),
}));
vi.mock("@/src/lib/razorpay-server", () => ({
  acceptPlacementPayment: vi.fn().mockResolvedValue({
    id: "pay_TEST123",
    orderId: "order_TEST123",
    amount: 60000,
    status: "captured",
  }),
  RazorpayGatewayError: class extends Error {
    statusCode: number;
    constructor(message: string, statusCode = 502) {
      super(message);
      this.statusCode = statusCode;
    }
  },
}));

import { prisma } from "@/src/lib/prisma";
import { invalidateOrderCache } from "@/src/lib/order-cache";
import { GET, POST } from "@/app/api/orders/route";

// Override getSession / checkAuth for admin-auth routes
vi.mock("@/src/lib/auth", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getSession: vi.fn().mockResolvedValue({ id: "admin-id", username: "admin", role: "admin" }),
    checkAuth: vi.fn().mockResolvedValue({ id: "admin-id", username: "admin", role: "admin" }),
  };
});

/**
 * This file is the HTTP seam for orders: envelope, status codes, the gateway
 * resolution the adapter owns, and the error taxonomy. The module's own rules —
 * placement and its gift-box bundling, the admin list query — are proven
 * against their interfaces in `order-intake.test.ts` and `order-read.test.ts`,
 * not through here.
 */

const mockOrder = {
  id: "order-uuid",
  orderNumber: "ORD-TEST",
  customerName: "Test User",
  customerEmail: "test@example.com",
  customerPhone: "9999999999",
  addressLine1: "123 Main St",
  addressLine2: null,
  city: "Mumbai",
  stateCode: "MH",
  postalCode: "400001",
  countryCode: "IN",
  status: "pending",
  trackingId: null,
  subtotal: 300,
  shippingCost: 0,
  totalAmount: 300,
  transactionId: "TXN001",
  customerNotes: null,
  adminNotes: null,
  version: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  items: [
    { id: "item-uuid", productId: "p1", productName: "Product 1", unitPrice: 100, quantity: 2, orderId: "order-uuid", createdAt: new Date() },
    { id: "item-uuid-2", productId: "p2", productName: "Product 2", unitPrice: 200, quantity: 1, orderId: "order-uuid", createdAt: new Date() },
  ],
};

const mockProducts = [
  { id: "p1", name: "Product 1", price: new Prisma.Decimal(100), stockQuantity: 10, isActive: true, sku: null, categoryId: null, description: null, imageUrl: null, badge: null, createdAt: new Date(), updatedAt: new Date(), categoryId: null },
  { id: "p2", name: "Product 2", price: new Prisma.Decimal(200), stockQuantity: 5, isActive: true, sku: null, categoryId: null, description: null, imageUrl: null, badge: null, createdAt: new Date(), updatedAt: new Date(), categoryId: null },
];

const razorpayBody = (over: Record<string, unknown> = {}) => ({
  customerName: "Test User",
  customerEmail: "test@example.com",
  customerPhone: "9999999999",
  addressLine1: "123 Main St",
  city: "Mumbai",
  stateCode: "MH",
  postalCode: "400001",
  transactionId: "TXN001",
  razorpayOrderId: "order_TEST123",
  items: [
    { id: "p1", quantity: 2 },
    { id: "p2", quantity: 1 },
  ],
  ...over,
});

describe("GET /api/orders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("envelopes the admin list read", async () => {
    vi.mocked(prisma.order.findMany).mockResolvedValue([mockOrder]);
    vi.mocked(prisma.order.count).mockResolvedValue(1);

    const response = await GET(createNextRequest("/api/orders"));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.orders).toHaveLength(1);
    expect(body.total).toBe(1);
    expect(body.page).toBe(1);
    expect(body.totalPages).toBe(1);
  });

  it("computes totalPages from the parsed limit", async () => {
    vi.mocked(prisma.order.findMany).mockResolvedValue([]);
    vi.mocked(prisma.order.count).mockResolvedValue(25);

    const body = await (await GET(createNextRequest("/api/orders?page=2&limit=5"))).json();
    expect(body).toMatchObject({ page: 2, limit: 5, total: 25, totalPages: 5 });
  });

  // The sort whitelist is this route's own vocabulary, so the adapter owns it.
  it("maps each valid sort value to a whitelisted orderBy", async () => {
    vi.mocked(prisma.order.findMany).mockResolvedValue([]);
    vi.mocked(prisma.order.count).mockResolvedValue(0);

    const cases: Array<[string, Record<string, string>]> = [
      ["date-asc", { createdAt: "asc" }],
      ["total-desc", { totalAmount: "desc" }],
      ["total-asc", { totalAmount: "asc" }],
    ];
    for (const [param, expectedOrderBy] of cases) {
      vi.mocked(prisma.order.findMany).mockClear();
      await GET(createNextRequest(`/api/orders?sort=${param}`));
      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: expectedOrderBy }),
      );
    }
  });

  it("returns 400 for an invalid sort value without querying", async () => {
    const response = await GET(createNextRequest("/api/orders?sort=bogus"));
    expect(response.status).toBe(400);
    expect(prisma.order.findMany).not.toHaveBeenCalled();
  });

  it("returns 500 on database error", async () => {
    vi.mocked(prisma.order.findMany).mockRejectedValue(new Error("DB error"));

    const response = await GET(createNextRequest("/api/orders"));
    expect(response.status).toBe(500);
  });
});

describe("POST /api/orders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates an order, then invalidates the order cache", async () => {
    vi.mocked(mockTx.product.findMany).mockResolvedValue(mockProducts);
    vi.mocked(mockTx.order.create).mockResolvedValue(mockOrder);
    vi.mocked(mockTx.product.update).mockResolvedValue({ ...mockProducts[0], stockQuantity: 8 });
    vi.mocked(prisma.$transaction).mockImplementation(
      async (cb: (tx: typeof mockTx) => unknown) => cb(mockTx),
    );

    const response = await POST(createNextRequest("/api/orders", { method: "POST", body: razorpayBody() }));

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ customerName: "Test User" });
    expect(invalidateOrderCache).toHaveBeenCalledWith("order-uuid");
  });

  it("returns 400 for missing required fields", async () => {
    const response = await POST(createNextRequest("/api/orders", {
      method: "POST",
      body: { customerName: "Test" },
    }));

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBeTruthy();
  });

  it("validates phone and postal code format at the boundary", async () => {
    const response = await POST(createNextRequest("/api/orders", {
      method: "POST",
      body: razorpayBody({ customerPhone: "999-999-9999", postalCode: "400 001" }),
    }));

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBeTruthy();
  });

  it("requires razorpayOrderId for razorpay placements", async () => {
    const response = await POST(createNextRequest("/api/orders", {
      method: "POST",
      body: razorpayBody({ razorpayOrderId: undefined }),
    }));

    expect(response.status).toBe(400);
    expect((await response.json()).error).toContain("Razorpay order ID is required");
  });

  it("skips the gateway call for manual (bank transfer) placements", async () => {
    const { acceptPlacementPayment } = await import("@/src/lib/razorpay-server");
    vi.mocked(mockTx.product.findMany).mockResolvedValue(mockProducts);
    vi.mocked(mockTx.order.create).mockResolvedValue(mockOrder);
    vi.mocked(mockTx.product.update).mockResolvedValue({ ...mockProducts[0], stockQuantity: 8 });
    vi.mocked(prisma.$transaction).mockImplementation(
      async (cb: (tx: typeof mockTx) => unknown) => cb(mockTx),
    );

    const response = await POST(createNextRequest("/api/orders", {
      method: "POST",
      body: razorpayBody({ transactionId: "NEFT-REF-001", paymentGateway: "manual", razorpayOrderId: undefined }),
    }));

    expect(response.status).toBe(201);
    expect(acceptPlacementPayment).not.toHaveBeenCalled();
  });

  // The gateway's status code becomes the response's — that mapping is the
  // adapter's job; the amount invariant it guards is order-intake's, tested there.
  it("passes a gateway 400 through without opening a transaction", async () => {
    const { acceptPlacementPayment, RazorpayGatewayError } = await import("@/src/lib/razorpay-server");
    vi.mocked(acceptPlacementPayment).mockRejectedValueOnce(
      new RazorpayGatewayError("Payment does not match this order. Please contact support.", 400),
    );

    const response = await POST(createNextRequest("/api/orders", { method: "POST", body: razorpayBody() }));

    expect(response.status).toBe(400);
    expect((await response.json()).error).toContain("does not match this order");
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(invalidateOrderCache).not.toHaveBeenCalled();
  });

  it("returns 500 on database error", async () => {
    vi.mocked(prisma.$transaction).mockRejectedValue(new Error("DB error"));

    const response = await POST(createNextRequest("/api/orders", { method: "POST", body: razorpayBody() }));
    expect(response.status).toBe(500);
  });
});