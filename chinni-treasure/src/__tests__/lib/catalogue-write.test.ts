import { vi, describe, it, expect, beforeEach } from "vitest";
import { createMockPrisma } from "@/src/__tests__/mocks/prisma";

vi.mock("@/src/lib/prisma", () => ({ prisma: createMockPrisma() }));

import { prisma } from "@/src/lib/prisma";
import {
  PRODUCT_WRITE_INCLUDE,
  updateProduct,
  createCategory,
  deleteCategory,
} from "@/src/lib/catalogue-write";
import { ProductSchema } from "@/src/lib/api/schemas";

const parsed = (over: Record<string, unknown>) =>
  ({ name: "Wallet", ...over }) as never;

describe("updateProduct", () => {
  beforeEach(() => vi.clearAllMocks());

  // The re-patch the route used to hold: an unchanged sku must not be resent,
  // or the unique index throws on a no-op save.
  it("drops an unchanged sku from the update payload", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue({ sku: "W-1", categoryId: 2 } as never);
    vi.mocked(prisma.product.update).mockResolvedValue({ id: "p1" } as never);

    await updateProduct("p1", parsed({ sku: "W-1", price: 500 }));

    expect(prisma.product.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.not.objectContaining({ sku: "W-1" }) }),
    );
  });

  it("keeps a changed sku", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue({ sku: "W-1", categoryId: 2 } as never);
    vi.mocked(prisma.product.update).mockResolvedValue({ id: "p1" } as never);

    await updateProduct("p1", parsed({ sku: "W-2" }));

    expect(prisma.product.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ sku: "W-2" }) }),
    );
  });

  // The batch array form of $transaction is rejected through this module's
  // prisma proxy (retry-wrapped promises lose the PrismaPromise tag), so the
  // replace runs interactively: one callback, delete + create inside it.
  function withInteractiveTx() {
    vi.mocked(prisma.$transaction).mockImplementation(async (cb) =>
      (cb as (tx: typeof prisma) => unknown)(prisma),
    );
  }

  it("replaces the gallery in one transaction, normalized to one primary", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue({ sku: null, categoryId: 2 } as never);
    vi.mocked(prisma.product.update).mockResolvedValue({ id: "p1" } as never);
    withInteractiveTx();

    await updateProduct("p1", parsed({
      images: [
        { url: "a.jpg", isPrimary: false },
        { url: "b.jpg", isPrimary: false },
      ],
    }));

    // delete + create, in a single atomic callback — two awaits left a window
    // with zero images on crash.
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.productImage.deleteMany).toHaveBeenCalledWith({ where: { productId: "p1" } });
    expect(prisma.productImage.createMany).toHaveBeenCalledWith({
      data: [
        { productId: "p1", url: "a.jpg", isPrimary: true, displayOrder: 0 },
        { productId: "p1", url: "b.jpg", isPrimary: false, displayOrder: 1 },
      ],
    });
  });

  it("deletes every image row when the gallery is sent empty", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue({ sku: null, categoryId: 2 } as never);
    vi.mocked(prisma.product.update).mockResolvedValue({ id: "p1" } as never);
    withInteractiveTx();

    await updateProduct("p1", parsed({ images: [] }));

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.productImage.deleteMany).toHaveBeenCalledWith({ where: { productId: "p1" } });
    expect(prisma.productImage.createMany).not.toHaveBeenCalled();
  });

  it("leaves the gallery alone when images is omitted entirely", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue({ sku: null, categoryId: 2 } as never);
    vi.mocked(prisma.product.update).mockResolvedValue({ id: "p1" } as never);

    await updateProduct("p1", parsed({ price: 500 }));

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("refuses gift-box bundling on a Gift Box category product (400)", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue({ sku: null, categoryId: 1 } as never);
    vi.mocked(prisma.category.findUnique).mockResolvedValue({ slug: "box" } as never);

    await expect(
      updateProduct("p1", parsed({ allowGiftBoxBundling: true })),
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(prisma.product.update).not.toHaveBeenCalled();
  });
});

describe("PRODUCT_WRITE_INCLUDE", () => {
  // The browser validates the POST/PUT response against ProductSchema. A key
  // required there but missing from this include 200s server-side and then
  // throws in the client — the include and the schema must not drift.
  it("selects every key ProductSchema requires on category", () => {
    const required = Object.keys(ProductSchema.shape.category.unwrap().shape);
    expect(Object.keys(PRODUCT_WRITE_INCLUDE.category.select)).toEqual(
      expect.arrayContaining(required),
    );
  });
});

describe("createCategory", () => {
  beforeEach(() => vi.clearAllMocks());

  it("derives the slug from the name and sanitises the fields", async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue(null as never);
    vi.mocked(prisma.category.create).mockResolvedValue({ id: 5 } as never);

    await createCategory({ name: "Gift Boxes" } as never);

    expect(prisma.category.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ slug: "gift-boxes", isActive: true, displayOrder: 0 }),
    });
  });

  it("suffixes a taken slug", async () => {
    vi.mocked(prisma.category.findUnique)
      .mockResolvedValueOnce({ id: 1, slug: "rings" } as never)
      .mockResolvedValueOnce(null as never);
    vi.mocked(prisma.category.create).mockResolvedValue({ id: 6 } as never);

    await createCategory({ name: "Rings" } as never);

    expect(prisma.category.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ slug: "rings-2" }),
    });
  });
});

describe("deleteCategory", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws a 409 while active products still reference it", async () => {
    vi.mocked(prisma.product.count).mockResolvedValue(3 as never);

    await expect(deleteCategory(5)).rejects.toMatchObject({ statusCode: 409 });
    expect(prisma.category.delete).not.toHaveBeenCalled();
  });

  it("deletes when nothing references it", async () => {
    vi.mocked(prisma.product.count).mockResolvedValue(0 as never);
    vi.mocked(prisma.category.delete).mockResolvedValue({ id: 5 } as never);

    await deleteCategory(5);

    expect(prisma.category.delete).toHaveBeenCalledWith({ where: { id: 5 } });
  });
});