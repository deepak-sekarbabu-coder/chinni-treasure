import { NextResponse } from "next/server";
import { validateOr400 } from "@/src/lib/validate";
import { withAdmin } from "@/src/lib/route-guard";
import { UpdateCategorySchema } from "@/src/lib/api/schemas";
import { deleteCategory, updateCategory } from "@/src/lib/catalogue-write";

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

    return NextResponse.json(await updateCategory(categoryId, parsed.data));
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

    await deleteCategory(categoryId);

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
