import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/src/lib/prisma";
import { checkAuth } from "@/src/lib/auth";
import { sanitize } from "@/src/lib/sanitize";
import { validateCsrfOrigin } from "@/src/lib/csrf";
import { invalidateCatalogCaches } from "@/src/lib/catalogue-cache";
import { Prisma } from "@prisma/client";
import { UpdateCategorySchema } from "@/src/lib/api/schemas";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

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
    const categoryId = Number.parseInt(id, 10);
    if (!Number.isFinite(categoryId)) {
      return NextResponse.json({ error: "Invalid category id" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = UpdateCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 },
      );
    }

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
    revalidatePath("/catalogue");
    revalidatePath("/");
    revalidatePath("/category", "layout");

    return NextResponse.json(category);
  } catch (error) {
    console.error("Failed to update category:", error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "A category with this slug already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 },
    );
  }
}

// DELETE /api/categories/[id] — Delete a category (admin only)
// Blocked if any non-deleted product still references it.
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
    revalidatePath("/catalogue");
    revalidatePath("/");
    revalidatePath("/category", "layout");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete category:", error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 },
    );
  }
}
