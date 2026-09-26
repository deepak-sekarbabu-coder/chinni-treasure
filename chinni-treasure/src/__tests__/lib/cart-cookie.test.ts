import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCartFromCookies, hydrateInitialCartItems } from "../../lib/cart-cookie";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/src/lib/prisma", () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
    },
  },
}));

import { cookies } from "next/headers";
import { prisma } from "@/src/lib/prisma";

const PARENT_UUID = "550e8400-e29b-41d4-a716-446655440000";
const BOX_UUID = "550e8400-e29b-41d4-a716-446655440001";

function mockCookieValue(value: string | undefined) {
  vi.mocked(cookies).mockResolvedValue({
    get: vi.fn().mockReturnValue(value ? { value } : undefined),
    set: vi.fn(),
    delete: vi.fn(),
  });
}

function mockProductRows(
  rows: Array<{ id: string; name: string; price: number; imageUrl: string | null; stockQuantity: number }>,
) {
  vi.mocked(prisma.product.findMany).mockResolvedValue(rows);
}

describe("getCartFromCookies", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("parses valid cart JSON from cookie", async () => {
    const validCart = [
      { productId: "550e8400-e29b-41d4-a716-446655440000", quantity: 2 },
    ];
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: JSON.stringify(validCart) }),
      set: vi.fn(),
      delete: vi.fn(),
    });

    const result = await getCartFromCookies();
    expect(result).toEqual(validCart);
  });

  it("returns empty array when cookie is missing", async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
      set: vi.fn(),
      delete: vi.fn(),
    });

    const result = await getCartFromCookies();
    expect(result).toEqual([]);
  });

  it("returns empty array for invalid schema (non-UUID productId)", async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: JSON.stringify([{ productId: "not-a-uuid", quantity: 1 }]) }),
      set: vi.fn(),
      delete: vi.fn(),
    });

    const result = await getCartFromCookies();
    expect(result).toEqual([]);
  });

  it("returns empty array for malformed JSON", async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "not-json-at-all" }),
      set: vi.fn(),
      delete: vi.fn(),
    });

    const result = await getCartFromCookies();
    expect(result).toEqual([]);
  });

  it("returns empty array for negative quantity", async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({
        value: JSON.stringify([{ productId: "550e8400-e29b-41d4-a716-446655440000", quantity: -1 }]),
      }),
      set: vi.fn(),
      delete: vi.fn(),
    });

    const result = await getCartFromCookies();
    expect(result).toEqual([]);
  });

  it("parses gift boxes attached to a cart item", async () => {
    const cartWithBoxes = [
      {
        productId: "550e8400-e29b-41d4-a716-446655440000",
        quantity: 2,
        giftBoxes: [
          { productId: "550e8400-e29b-41d4-a716-446655440001", quantity: 1 },
        ],
      },
    ];
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: JSON.stringify(cartWithBoxes) }),
      set: vi.fn(),
      delete: vi.fn(),
    });

    const result = await getCartFromCookies();
    expect(result).toEqual(cartWithBoxes);
  });

  it("returns empty array for an invalid gift box entry", async () => {
    const cartWithBadBox = [
      {
        productId: "550e8400-e29b-41d4-a716-446655440000",
        quantity: 1,
        giftBoxes: [{ productId: "not-a-uuid", quantity: 1 }],
      },
    ];
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: JSON.stringify(cartWithBadBox) }),
      set: vi.fn(),
      delete: vi.fn(),
    });

    const result = await getCartFromCookies();
    expect(result).toEqual([]);
  });
});

describe("hydrateInitialCartItems", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns [] and skips the database when the cart cookie is empty", async () => {
    mockCookieValue(undefined);
    const result = await hydrateInitialCartItems();
    expect(result).toEqual([]);
    expect(prisma.product.findMany).not.toHaveBeenCalled();
  });

  it("hydrates a full display item from the cookie + product row", async () => {
    mockCookieValue(JSON.stringify([{ productId: PARENT_UUID, quantity: 2 }]));
    mockProductRows([
      { id: PARENT_UUID, name: "Gold Ring", price: 1200, imageUrl: "/ring.jpg", stockQuantity: 5 },
    ]);

    const result = await hydrateInitialCartItems();
    expect(result).toEqual([
      { productId: PARENT_UUID, name: "Gold Ring", price: 1200, quantity: 2, image: "/ring.jpg", stock: 5 },
    ]);
  });

  it("hydrates gift boxes attached to a line", async () => {
    mockCookieValue(
      JSON.stringify([{ productId: PARENT_UUID, quantity: 1, giftBoxes: [{ productId: BOX_UUID, quantity: 2 }] }]),
    );
    mockProductRows([
      { id: PARENT_UUID, name: "Gold Ring", price: 1200, imageUrl: "/ring.jpg", stockQuantity: 5 },
      { id: BOX_UUID, name: "Luxury Box", price: 150, imageUrl: "/box.jpg", stockQuantity: 10 },
    ]);

    const result = await hydrateInitialCartItems();
    expect(result).toEqual([
      {
        productId: PARENT_UUID,
        name: "Gold Ring",
        price: 1200,
        quantity: 1,
        image: "/ring.jpg",
        stock: 5,
        giftBoxes: [{ productId: BOX_UUID, name: "Luxury Box", price: 150, image: "/box.jpg", quantity: 2 }],
      },
    ]);
  });

  it("skips lines whose product is missing or inactive", async () => {
    mockCookieValue(
      JSON.stringify([
        { productId: PARENT_UUID, quantity: 1 },
        { productId: BOX_UUID, quantity: 3 },
      ]),
    );
    mockProductRows([
      { id: PARENT_UUID, name: "Gold Ring", price: 1200, imageUrl: "/ring.jpg", stockQuantity: 5 },
    ]);

    const result = await hydrateInitialCartItems();
    expect(result).toHaveLength(1);
    expect(result[0].productId).toBe(PARENT_UUID);
  });

  it("drops unresolvable gift boxes but keeps the parent", async () => {
    mockCookieValue(
      JSON.stringify([{ productId: PARENT_UUID, quantity: 1, giftBoxes: [{ productId: BOX_UUID, quantity: 1 }] }]),
    );
    mockProductRows([
      { id: PARENT_UUID, name: "Gold Ring", price: 1200, imageUrl: null, stockQuantity: 5 },
    ]);

    const result = await hydrateInitialCartItems();
    expect(result).toEqual([
      { productId: PARENT_UUID, name: "Gold Ring", price: 1200, quantity: 1, image: "", stock: 5 },
    ]);
  });

  it("queries only active products listed in the cookie", async () => {
    mockCookieValue(JSON.stringify([{ productId: PARENT_UUID, quantity: 1 }]));
    mockProductRows([]);

    await hydrateInitialCartItems();
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: [PARENT_UUID] }, isActive: true },
      }),
    );
  });
});