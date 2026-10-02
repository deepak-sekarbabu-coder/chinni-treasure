import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { validateOr400 } from "@/src/lib/validate";
import { withAdmin } from "@/src/lib/route-guard";
import { updateProduct } from "@/src/lib/catalogue-write";
import { UpdateProductInputSchema } from "@/src/lib/api/schemas";

// PUT /api/products/[id] — Update a product (admin only)
export const PUT = withAdmin<{ id: string }>(
  async ({ body, params }) => {
    const { id } = params;
    const parsed = validateOr400(UpdateProductInputSchema, body);
    if (!parsed.ok) return parsed.response;

    return NextResponse.json(await updateProduct(id, parsed.data));
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
