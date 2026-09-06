import { vi, describe, it, expect, beforeEach } from "vitest";
import { createNextRequest } from "@/src/__tests__/utils/api-test";
import { createMockPrisma, mockTx } from "@/src/__tests__/mocks/prisma";
import { Prisma } from "@prisma/client";

vi.mock("@/src/lib/prisma", () => ({ prisma: createMockPrisma() }));
vi.mock("@/src/lib/rate-limiter", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 3 }),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
}));
vi.mock("isomorphic-dompurify", () => ({
  default: {
    sanitize: (input: string) => input.trim(),
  },
}));

import { prisma } from "@/src/lib/prisma";
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

describe("GET /api/orders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns paginated orders for admin", async () => {
    vi.mocked(prisma.order.findMany).mockResolvedValue([mockOrder]);
    vi.mocked(prisma.order.count).mockResolvedValue(1);

    const req = createNextRequest("/api/orders");
    const response = await GET(req);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.orders).toHaveLength(1);
    expect(body.total).toBe(1);
    expect(body.page).toBe(1);
    expect(body.totalPages).toBe(1);
  });

  it("respects page and limit query params", async () => {
    vi.mocked(prisma.order.findMany).mockResolvedValue([]);
    vi.mocked(prisma.order.count).mockResolvedValue(25);

    const req = createNextRequest("/api/orders?page=2&limit=5");
    await GET(req);

    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 5, take: 5 }),
    );
  });

  it("filters by status when provided", async () => {
    vi.mocked(prisma.order.findMany).mockResolvedValue([mockOrder]);
    vi.mocked(prisma.order.count).mockResolvedValue(1);

    const req = createNextRequest("/api/orders?status=pending");
    await GET(req);

    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: "pending" },
      }),
    );
  });

  it("clamps limit to max 100", async () => {
    vi.mocked(prisma.order.findMany).mockResolvedValue([]);
    vi.mocked(prisma.order.count).mockResolvedValue(500);

    const req = createNextRequest("/api/orders?limit=999");
    await GET(req);

    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 }),
    );
  });

  it("returns 500 on database error", async () => {
    vi.mocked(prisma.order.findMany).mockRejectedValue(new Error("DB error"));

    const req = createNextRequest("/api/orders");
    const response = await GET(req);
    expect(response.status).toBe(500);
  });

  it("defaults to createdAt desc ordering", async () => {
    vi.mocked(prisma.order.findMany).mockResolvedValue([]);
    vi.mocked(prisma.order.count).mockResolvedValue(0);

    await GET(createNextRequest("/api/orders"));

    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: "desc" } }),
    );
  });

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

  it("returns 400 for an invalid sort value", async () => {
    const response = await GET(createNextRequest("/api/orders?sort=bogus"));
    expect(response.status).toBe(400);
    expect(prisma.order.findMany).not.toHaveBeenCalled();
  });
});

describe("POST /api/orders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates an order successfully with stock deduction", async () => {
    vi.mocked(mockTx.product.findMany).mockResolvedValue(mockProducts);
    vi.mocked(mockTx.order.create).mockResolvedValue(mockOrder);
    vi.mocked(mockTx.product.update).mockResolvedValue({ ...mockProducts[0], stockQuantity: 8 });
    vi.mocked(prisma.$transaction).mockImplementation(
      async (cb: (tx: typeof mockTx) => unknown) => cb(mockTx),
    );

    const req = createNextRequest("/api/orders", {
      method: "POST",
      body: {
        customerName: "Test User",
        customerEmail: "test@example.com",
        customerPhone: "9999999999",
        addressLine1: "123 Main St",
        city: "Mumbai",
        stateCode: "MH",
        postalCode: "400001",
        transactionId: "TXN001",
        items: [
          { id: "p1", quantity: 2 },
          { id: "p2", quantity: 1 },
        ],
      },
    });

    const response = await POST(req);
    expect(response.status).toBe(201);

    expect(mockTx.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subtotal: 400,
          shippingCost: 200,
          totalAmount: 600,
        }),
      }),
    );

    const body = await response.json();
    expect(body.customerName).toBe("Test User");
  });

  it("returns 400 for missing required fields", async () => {
    const req = createNextRequest("/api/orders", {
      method: "POST",
      body: { customerName: "Test" },
    });

    const response = await POST(req);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toBeTruthy();
  });

  it("returns 400 for insufficient stock", async () => {
    const lowStockProducts = [
      { ...mockProducts[0], stockQuantity: 1 },
      mockProducts[1],
    ];

    vi.mocked(mockTx.product.findMany).mockResolvedValue(lowStockProducts);
    vi.mocked(prisma.$transaction).mockImplementation(
      async (cb: (tx: typeof mockTx) => unknown) => cb(mockTx),
    );

    const req = createNextRequest("/api/orders", {
      method: "POST",
      body: {
        customerName: "Test User",
        customerEmail: "test@example.com",
        customerPhone: "9999999999",
        addressLine1: "123 Main St",
        city: "Mumbai",
        stateCode: "MH",
        postalCode: "400001",
        transactionId: "TXN001",
        items: [{ id: "p1", quantity: 99 }],
      },
    });

    const response = await POST(req);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toContain("Insufficient stock");
  });

  it("creates an order with gift boxes linked to the parent order item", async () => {
    const parentProduct = {
      ...mockProducts[0],
      allowGiftBoxBundling: true,
      category: null,
    };
    const giftBoxProduct = {
      ...mockProducts[1],
      allowGiftBoxBundling: false,
      category: { slug: "box" },
    };
    const createdWithParents = {
      ...mockOrder,
      items: [
        { id: "parent-item-1", productId: "p1", productName: "Product 1", unitPrice: 100, quantity: 2, orderId: "order-uuid", createdAt: new Date() },
      ],
    };
    const finalOrder = {
      ...createdWithParents,
      items: [
        createdWithParents.items[0],
        { id: "box-item-1", productId: "p2", productName: "Gift Box", unitPrice: 200, quantity: 2, orderId: "order-uuid", parentOrderItemId: "parent-item-1", createdAt: new Date() },
      ],
    };

    vi.mocked(mockTx.product.findMany).mockResolvedValue([parentProduct, giftBoxProduct]);
    vi.mocked(mockTx.order.create).mockResolvedValue(createdWithParents);
    vi.mocked(mockTx.order.findUnique).mockResolvedValue(finalOrder);
    vi.mocked(mockTx.product.update).mockResolvedValue({ ...parentProduct, stockQuantity: 8 });
    vi.mocked(prisma.$transaction).mockImplementation(
      async (cb: (tx: typeof mockTx) => unknown) => cb(mockTx),
    );

    const req = createNextRequest("/api/orders", {
      method: "POST",
      body: {
        customerName: "Test User",
        customerEmail: "test@example.com",
        customerPhone: "9999999999",
        addressLine1: "123 Main St",
        city: "Mumbai",
        stateCode: "MH",
        postalCode: "400001",
        transactionId: "TXN001",
        items: [
          {
            id: "p1",
            quantity: 2,
            giftBoxes: [{ id: "p2", quantity: 2 }],
          },
        ],
      },
    });

    const response = await POST(req);
    expect(response.status).toBe(201);

    expect(mockTx.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subtotal: 600,
          shippingCost: 0,
          totalAmount: 600,
          items: {
            create: [
              expect.objectContaining({ productId: "p1", quantity: 2 }),
            ],
          },
        }),
      }),
    );

    expect(mockTx.orderItem.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          productId: "p2",
          quantity: 2,
          parentOrderItemId: "parent-item-1",
        }),
      ],
    });

    expect(mockTx.product.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { stockQuantity: { decrement: 2 } } }),
    );

    const body = await response.json();
    expect(body.items).toHaveLength(2);
    expect(body.items[1].parentOrderItemId).toBe("parent-item-1");
  });

  it("returns 400 when gift box quantity exceeds the parent quantity", async () => {
    const parentProduct = {
      ...mockProducts[0],
      allowGiftBoxBundling: true,
      category: null,
    };
    const giftBoxProduct = {
      ...mockProducts[1],
      category: { slug: "box" },
    };

    vi.mocked(mockTx.product.findMany).mockResolvedValue([parentProduct, giftBoxProduct]);
    vi.mocked(prisma.$transaction).mockImplementation(
      async (cb: (tx: typeof mockTx) => unknown) => cb(mockTx),
    );

    const req = createNextRequest("/api/orders", {
      method: "POST",
      body: {
        customerName: "Test User",
        customerEmail: "test@example.com",
        customerPhone: "9999999999",
        addressLine1: "123 Main St",
        city: "Mumbai",
        stateCode: "MH",
        postalCode: "400001",
        transactionId: "TXN001",
        items: [
          {
            id: "p1",
            quantity: 1,
            giftBoxes: [{ id: "p2", quantity: 3 }],
          },
        ],
      },
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("cannot exceed");
  });

  it("returns 400 when the parent product does not support bundling", async () => {
    const parentProduct = {
      ...mockProducts[0],
      allowGiftBoxBundling: false,
      category: null,
    };
    const giftBoxProduct = {
      ...mockProducts[1],
      category: { slug: "box" },
    };

    vi.mocked(mockTx.product.findMany).mockResolvedValue([parentProduct, giftBoxProduct]);
    vi.mocked(prisma.$transaction).mockImplementation(
      async (cb: (tx: typeof mockTx) => unknown) => cb(mockTx),
    );

    const req = createNextRequest("/api/orders", {
      method: "POST",
      body: {
        customerName: "Test User",
        customerEmail: "test@example.com",
        customerPhone: "9999999999",
        addressLine1: "123 Main St",
        city: "Mumbai",
        stateCode: "MH",
        postalCode: "400001",
        transactionId: "TXN001",
        items: [
          {
            id: "p1",
            quantity: 1,
            giftBoxes: [{ id: "p2", quantity: 1 }],
          },
        ],
      },
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("does not support gift box bundling");
  });

  it("returns 400 when a bundled product is not in the gift box category", async () => {
    const parentProduct = {
      ...mockProducts[0],
      allowGiftBoxBundling: true,
      category: null,
    };
    const notAGiftBox = {
      ...mockProducts[1],
      category: { slug: "jewellery" },
    };

    vi.mocked(mockTx.product.findMany).mockResolvedValue([parentProduct, notAGiftBox]);
    vi.mocked(prisma.$transaction).mockImplementation(
      async (cb: (tx: typeof mockTx) => unknown) => cb(mockTx),
    );

    const req = createNextRequest("/api/orders", {
      method: "POST",
      body: {
        customerName: "Test User",
        customerEmail: "test@example.com",
        customerPhone: "9999999999",
        addressLine1: "123 Main St",
        city: "Mumbai",
        stateCode: "MH",
        postalCode: "400001",
        transactionId: "TXN001",
        items: [
          {
            id: "p1",
            quantity: 1,
            giftBoxes: [{ id: "p2", quantity: 1 }],
          },
        ],
      },
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("is not a gift box");
  });

  it("returns 400 when gift box stock is insufficient", async () => {
    const parentProduct = {
      ...mockProducts[0],
      allowGiftBoxBundling: true,
      category: null,
    };
    const lowStockGiftBox = {
      ...mockProducts[1],
      stockQuantity: 1,
      category: { slug: "box" },
    };

    vi.mocked(mockTx.product.findMany).mockResolvedValue([parentProduct, lowStockGiftBox]);
    vi.mocked(prisma.$transaction).mockImplementation(
      async (cb: (tx: typeof mockTx) => unknown) => cb(mockTx),
    );

    const req = createNextRequest("/api/orders", {
      method: "POST",
      body: {
        customerName: "Test User",
        customerEmail: "test@example.com",
        customerPhone: "9999999999",
        addressLine1: "123 Main St",
        city: "Mumbai",
        stateCode: "MH",
        postalCode: "400001",
        transactionId: "TXN001",
        items: [
          {
            id: "p1",
            quantity: 2,
            giftBoxes: [{ id: "p2", quantity: 5 }],
          },
        ],
      },
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("Insufficient stock for gift box");
  });

  it("returns 400 when a gift box product is used as a bundle parent", async () => {
    const giftBoxAsParent = {
      ...mockProducts[0],
      allowGiftBoxBundling: true,
      category: { slug: "box" },
    };
    const giftBoxProduct = {
      ...mockProducts[1],
      category: { slug: "box" },
    };

    vi.mocked(mockTx.product.findMany).mockResolvedValue([giftBoxAsParent, giftBoxProduct]);
    vi.mocked(prisma.$transaction).mockImplementation(
      async (cb: (tx: typeof mockTx) => unknown) => cb(mockTx),
    );

    const req = createNextRequest("/api/orders", {
      method: "POST",
      body: {
        customerName: "Test User",
        customerEmail: "test@example.com",
        customerPhone: "9999999999",
        addressLine1: "123 Main St",
        city: "Mumbai",
        stateCode: "MH",
        postalCode: "400001",
        transactionId: "TXN001",
        items: [
          {
            id: "p1",
            quantity: 1,
            giftBoxes: [{ id: "p2", quantity: 1 }],
          },
        ],
      },
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("cannot be bundled onto");
  });

  it("validates phone and postal code format at boundary", async () => {
    const req = createNextRequest("/api/orders", {
      method: "POST",
      body: {
        customerName: "Test",
        customerEmail: "test@test.com",
        customerPhone: "999-999-9999",
        addressLine1: "123 St",
        city: "Mumbai",
        stateCode: "MH",
        postalCode: "400 001",
        transactionId: "TXN002",
        items: [{ id: "p1", quantity: 1 }],
      },
    });

    const response = await POST(req);
    // Zod now rejects non-digit phone/postal at the boundary
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeTruthy();
  });

  it("returns 500 on database error", async () => {
    vi.mocked(prisma.$transaction).mockRejectedValue(new Error("DB error"));

    const req = createNextRequest("/api/orders", {
      method: "POST",
      body: {
        customerName: "Test",
        customerEmail: "test@test.com",
        customerPhone: "9999999999",
        addressLine1: "123 St",
        city: "Mumbai",
        stateCode: "MH",
        postalCode: "400001",
        transactionId: "TXN003",
        items: [{ id: "p1", quantity: 1 }],
      },
    });

    const response = await POST(req);
    expect(response.status).toBe(500);
  });
});
