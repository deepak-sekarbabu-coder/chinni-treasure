import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { checkAuth } from "@/src/lib/auth";
import { sanitize } from "@/src/lib/sanitize";

// PUT /api/products/[id] — Update a product (admin only)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await checkAuth();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { sku, name, categoryId, description, price, stockQuantity, imageUrl, badge, isActive } = body;

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(sku !== undefined && { sku }),
        ...(name !== undefined && { name: sanitize(name) }),
        ...(categoryId !== undefined && { categoryId: categoryId || null }),
        ...(description !== undefined && { description: description ? sanitize(description) : null }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(stockQuantity !== undefined && { stockQuantity }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
        ...(badge !== undefined && { badge: badge || null }),
        ...(isActive !== undefined && { isActive }),
      },
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
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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
