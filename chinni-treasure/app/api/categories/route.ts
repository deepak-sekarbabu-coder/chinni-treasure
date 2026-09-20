import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { sanitize } from "@/src/lib/sanitize";
import { validateOr400 } from "@/src/lib/validate";
import { invalidateCatalogCaches } from "@/src/lib/catalogue-cache";
import { withAdmin } from "@/src/lib/admin-route";
import { checkAuth } from "@/src/lib/auth";
import { CreateCategorySchema } from "@/src/lib/api/schemas";
import { slugify } from "@/src/lib/utils";
import { generateUniqueSlug } from "@/src/lib/catalogue-write";
import { loadActiveCategories } from "@/src/lib/product-read";

// GET /api/categories
// Public: returns active categories ordered by displayOrder.
// Admin (authenticated): returns all categories when ?includeInactive=true.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    // Public (active) response comes through the module's loadActiveCategories
    // surface — cached under the shared `active` key, invalidated by the module.
    // The admin variant (includeInactive=true) must always be fresh.
    if (!includeInactive) {
      const categories = await loadActiveCategories();
      return NextResponse.json(categories, {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      });
    }

    const admin = await checkAuth();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const categories = await prisma.category.findMany({
      where: {},
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        displayOrder: true,
        isActive: true,
        _count: { select: { products: { where: { deletedAt: null } } } },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { displayOrder: "asc" },
    });

    const payload = categories.map((c) => ({
      ...c,
      productCount: c._count ? c._count.products ?? 0 : undefined,
    }));

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 },
    );
  }
}

// POST /api/categories — Create a category (admin only)
export const POST = withAdmin(
  async ({ body }) => {
    const parsed = validateOr400(CreateCategorySchema, body);
    if (!parsed.ok) return parsed.response;

    const baseSlug = parsed.data.slug
      ? slugify(parsed.data.slug)
      : slugify(parsed.data.name);
    const slug = await generateUniqueSlug(baseSlug);

    const category = await prisma.category.create({
      data: {
        name: sanitize(parsed.data.name),
        slug,
        description: parsed.data.description
          ? sanitize(parsed.data.description)
          : null,
        displayOrder: parsed.data.displayOrder ?? 0,
        isActive: parsed.data.isActive ?? true,
      },
    });

    await invalidateCatalogCaches();

    return NextResponse.json(category, { status: 201 });
  },
  {
    parseBody: true,
    revalidateCatalogue: true,
    fallbackError: "Failed to create category",
    errorMessages: {
      p2002: "A category with this slug already exists",
    },
  },
);
