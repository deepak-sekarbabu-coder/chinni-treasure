import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { validateOr400 } from "@/src/lib/validate";
import { withAdmin } from "@/src/lib/route-guard";
import { assertGiftBoxNotOnBox, buildUpdateData } from "@/src/lib/catalogue-write";
import { UpdateProductInputSchema } from "@/src/lib/api/schemas";

// PUT /api/products/[id] — Update a product (admin only)
export const PUT = withAdmin<{ id: string }>(
  async ({ body, params }) => {
    const { id } = params;
    const parsed = validateOr400(UpdateProductInputSchema, body);
    if (!parsed.ok) return parsed.response;

    const { images, allowGiftBoxBundling, ...productFields } = parsed.data;

    // Handle image updates: delete existing, create new ones
    if (images !== undefined) {
      await prisma.productImage.deleteMany({ where: { productId: id } });
      if (images.length > 0) {
        await prisma.productImage.createMany({
          data: images.map((img, idx) => ({
            productId: id,
            url: img.url,
            isPrimary: img.isPrimary ?? idx === 0,
            displayOrder: img.displayOrder ?? idx,
          })),
        });
      }
    }

    // Avoid unique-constraint collisions when the SKU is unchanged:
    // only include `sku` in the update payload when it actually differs
    // from the current product's value.
    const existing = await prisma.product.findUnique({
      where: { id },
      select: { sku: true, categoryId: true, allowGiftBoxBundling: true },
    });

    if (allowGiftBoxBundling) {
      await assertGiftBoxNotOnBox(existing?.categoryId ?? null);
    }

    const updateData = buildUpdateData(productFields);
    if (updateData.sku !== undefined && existing && updateData.sku === existing.sku) {
      delete updateData.sku;
    }
    if (allowGiftBoxBundling !== undefined) {
      updateData.allowGiftBoxBundling = allowGiftBoxBundling;
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData as Parameters<typeof prisma.product.update>[0]["data"],
      include: {
        category: { select: { name: true } },
        images: { orderBy: { displayOrder: "asc" } },
      },
    });

    return NextResponse.json(product);
  },
  {
    parseBody: true,
    revalidateCatalogue: true,
    fallbackError: "Failed to update product",
    errorMessages: {
      p2002: (target) =>
        target.includes("sku")
          ? "A product with this SKU already exists. Please use a unique SKU or leave it blank."
          : `A product with this ${target} already exists`,
      p2025: "Product not found",
    },
  },
);

// DELETE /api/products/[id] — Delete a product (admin only)
export const DELETE = withAdmin<{ id: string }>(
  async ({ params }) => {
    const { id } = params;
    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  },
  {
    revalidateCatalogue: true,
    fallbackError: "Failed to delete product",
  },
);
