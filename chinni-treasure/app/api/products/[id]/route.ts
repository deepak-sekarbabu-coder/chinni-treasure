import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/src/lib/prisma";
import { checkAuth } from "@/src/lib/auth";
import { sanitize } from "@/src/lib/sanitize";
import { validateCsrfOrigin } from "@/src/lib/csrf";
import { validateOr400 } from "@/src/lib/validate";
import { invalidateCatalogCaches } from "@/src/lib/catalogue-cache";
import { z } from "zod"
import { Prisma, ProductBadge } from "@prisma/client"

const ImageInputSchema = z.object({
  url: z.string().min(1),
  isPrimary: z.boolean().optional(),
  displayOrder: z.number().int().min(0).optional(),
});

const UpdateProductSchema = z.object({
  name: z.string().min(1).optional(),
  price: z.coerce.number().positive("Price must be a positive number").optional(),
  compareAtPrice: z.coerce.number().positive("Compare at price must be positive").optional().nullable(),
  sku: z.string().optional().nullable(),
  categoryId: z.coerce.number().int().positive().optional().nullable(),
  description: z.string().optional().nullable(),
  stockQuantity: z.coerce.number().int().min(0).optional(),
  imageUrl: z.string().optional().nullable(),
  badge: z.nativeEnum(ProductBadge).optional().nullable(),
  isActive: z.boolean().optional(),
  visibleHostnames: z.string().optional().nullable(),
  images: z.array(ImageInputSchema).optional(),
});

const FIELD_MAPPERS: Record<string, (v: unknown) => unknown> = {
  sku: (v) => v,
  name: (v) => sanitize(v as string),
  categoryId: (v) => v ?? null,
  description: (v) => (v ? sanitize(v as string) : null),
  price: (v) => v,
  compareAtPrice: (v) => v ?? null,
  stockQuantity: (v) => v,
  imageUrl: (v) => v || null,
  badge: (v) => v || null,
  isActive: (v) => v,
  visibleHostnames: (v) => v || null,
};

function buildUpdateData(parsed: Record<string, unknown>): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (value !== undefined && key !== "images") {
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
    const parsed = validateOr400(UpdateProductSchema, body);
    if (!parsed.ok) return parsed.response;

    const { images, ...productFields } = parsed.data;

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
      select: { sku: true },
    });
    const updateData = buildUpdateData(productFields as Record<string, unknown>) as Record<string, unknown>;
    if (updateData.sku !== undefined && existing && updateData.sku === existing.sku) {
      delete updateData.sku;
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData as Parameters<typeof prisma.product.update>[0]["data"],
      include: {
        category: { select: { name: true } },
        images: { orderBy: { displayOrder: "asc" } },
      },
    });

    await invalidateCatalogCaches();
    revalidatePath("/catalogue");
    revalidatePath("/");
    revalidatePath("/category", "layout");

    return NextResponse.json(product);
  } catch (error) {
    console.error("Failed to update product:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        const target = (error.meta?.target as string[])?.join(", ") || "field";
        if (target.includes("sku")) {
          return NextResponse.json(
            { error: "A product with this SKU already exists. Please use a unique SKU or leave it blank." },
            { status: 409 },
          );
        }
        return NextResponse.json({ error: `A product with this ${target} already exists` }, { status: 409 });
      }
      if (error.code === "P2025") {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }
    }
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
      data: { deletedAt: new Date() },
    });

    await invalidateCatalogCaches();
    revalidatePath("/catalogue");
    revalidatePath("/");
    revalidatePath("/category", "layout");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete product:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
