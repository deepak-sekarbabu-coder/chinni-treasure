import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { checkAuth } from "@/src/lib/auth";
import { sanitize } from "@/src/lib/sanitize";
import { validateCsrfOrigin } from "@/src/lib/csrf";
import { z } from "zod"
import { ProductBadge } from "@prisma/client"

const UpdateProductSchema = z.object({
  name: z.string().min(1).optional(),
  price: z.coerce.number().positive("Price must be a positive number").optional(),
  sku: z.string().optional().nullable(),
  categoryId: z.coerce.number().int().positive().optional().nullable(),
  description: z.string().optional().nullable(),
  stockQuantity: z.coerce.number().int().min(0).optional(),
  imageUrl: z.string().optional().nullable(),
  badge: z.nativeEnum(ProductBadge).optional().nullable(),
  isActive: z.boolean().optional(),
});

// PUT /api/products/[id] — Update a product (admin only)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const csrfError = validateCsrfOrigin(request);
  if (csrfError) return csrfError;

  const admin = await checkAuth();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const parsed = UpdateProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 },
      );
    }
    const { sku, name, categoryId, description, price, stockQuantity, imageUrl, badge, isActive } = parsed.data;

    // Build update data imperatively to avoid Prisma's complex conditional spread types
    const data: Record<string, unknown> = {};
    if (sku !== undefined) data.sku = sku;
    if (name !== undefined) data.name = sanitize(name);
    if (categoryId !== undefined) data.categoryId = categoryId ?? null;
    if (description !== undefined) data.description = description ? sanitize(description) : null;
    if (price !== undefined) data.price = price;
    if (stockQuantity !== undefined) data.stockQuantity = stockQuantity;
    if (imageUrl !== undefined) data.imageUrl = imageUrl || null;
    if (badge !== undefined) data.badge = badge || null;
    if (isActive !== undefined) data.isActive = isActive;

    const product = await prisma.product.update({
      where: { id },
      data: data as Parameters<typeof prisma.product.update>[0]["data"],
      include: { category: { select: { name: true } } },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Failed to update product:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

// DELETE /api/products/[id] — Delete a product (admin only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const csrfError = validateCsrfOrigin(request);
  if (csrfError) return csrfError;

  const admin = await checkAuth();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete product:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
