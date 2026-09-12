import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { sanitize } from "@/src/lib/sanitize";
import { validateOr400 } from "@/src/lib/validate";
import { invalidateCatalogCaches } from "@/src/lib/catalogue-cache";
import { withAdmin } from "@/src/lib/admin-route";
import { Prisma } from "@prisma/client";
import { UpdateCategorySchema } from "@/src/lib/api/schemas";
import { slugify } from "@/src/lib/utils";

async function generateUniqueSlug(base: string, ignoreId: number): Promise<string> {
  let slug = base || "category";
  let attempt = 1;
  while (true) {
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (!existing || existing.id === ignoreId) return slug;
    attempt += 1;
    slug = `${base}-${attempt}`;
  }
}

// PUT /api/categories/[id] — Update a category (admin only)
export const PUT = withAdmin<{ id: string }>(
  async ({ body, params }) => {
    const { id } = params;
    const categoryId = Number.parseInt(id, 10);
    if (!Number.isFinite(categoryId)) {
      return NextResponse.json({ error: "Invalid category id" }, { status: 400 });
    }

    const parsed = validateOr400(UpdateCategorySchema, body);
    if (!parsed.ok) return parsed.response;

    const data: Prisma.CategoryUpdateInput = {};
    if (parsed.data.name !== undefined) data.name = sanitize(parsed.data.name);
    if (parsed.data.description !== undefined) {
      data.description = parsed.data.description
        ? sanitize(parsed.data.description)
        : null;
    }
    if (parsed.data.displayOrder !== undefined) {
      data.displayOrder = parsed.data.displayOrder;
    }
    if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive;
    if (parsed.data.slug !== undefined) {
      data.slug = await generateUniqueSlug(slugify(parsed.data.slug), categoryId);
    }

    const category = await prisma.category.update({
      where: { id: categoryId },
      data,
    });

    await invalidateCatalogCaches();

    return NextResponse.json(category);
  },
  {
    parseBody: true,
    revalidateCatalogue: true,
    fallbackError: "Failed to update category",
    errorMessages: {
      p2025: "Category not found",
      p2002: "A category with this slug already exists",
    },
  },
);

// DELETE /api/categories/[id] — Delete a category (admin only)
// Blocked if any non-deleted product still references it.
export const DELETE = withAdmin<{ id: string }>(
  async ({ params }) => {
    const { id } = params;
    const categoryId = Number.parseInt(id, 10);
    if (!Number.isFinite(categoryId)) {
      return NextResponse.json({ error: "Invalid category id" }, { status: 400 });
    }

    const productCount = await prisma.product.count({
      where: { categoryId, deletedAt: null },
    });

    if (productCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete category. ${productCount} active product(s) still belong to it. Reassign or delete them first.`,
        },
        { status: 409 },
      );
    }

    await prisma.category.delete({ where: { id: categoryId } });

    await invalidateCatalogCaches();

    return NextResponse.json({ success: true });
  },
  {
    revalidateCatalogue: true,
    fallbackError: "Failed to delete category",
    errorMessages: {
      p2025: "Category not found",
    },
  },
);
