import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { checkAuth } from "@/src/lib/auth";
import { sanitize } from "@/src/lib/sanitize";
import { validateCsrfOrigin } from "@/src/lib/csrf";
import { clearCache } from "@/src/lib/products-cache";
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

const FIELD_MAPPERS: Record<string, (v: unknown) => unknown> = {
  sku: (v) => v,
  name: (v) => sanitize(v as string),
  categoryId: (v) => v ?? null,
  description: (v) => (v ? sanitize(v as string) : null),
  price: (v) => v,
  stockQuantity: (v) => v,
  imageUrl: (v) => v || null,
  badge: (v) => v || null,
  isActive: (v) => v,
};

function buildUpdateData(parsed: Record<string, unknown>): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (value !== undefined) {
      data[key] = FIELD_MAPPERS[key] ? FIELD_MAPPERS[key](value) : value;
    }
  }
  return data;
}

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

    const product = await prisma.product.update({
      where: { id },
      data: buildUpdateData(parsed.data as Record<string, unknown>) as Parameters<typeof prisma.product.update>[0]["data"],
      include: { category: { select: { name: true } } },
    });

    clearCache();

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

    clearCache();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete product:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
