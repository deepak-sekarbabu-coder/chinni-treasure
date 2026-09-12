import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { sanitize } from "@/src/lib/sanitize";
import { validateOr400 } from "@/src/lib/validate";
import { categoriesCache, invalidateCatalogCaches } from "@/src/lib/catalogue-cache";
import { withAdmin } from "@/src/lib/admin-route";
import { checkAuth } from "@/src/lib/auth";
import { CreateCategorySchema } from "@/src/lib/api/schemas";
import { slugify } from "@/src/lib/utils";

const { get: getCached, set: setCache } = categoriesCache;

// GET /api/categories
// Public: returns active categories ordered by displayOrder.
// Admin (authenticated): returns all categories when ?includeInactive=true.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    // Cache only the public (active) response — the admin variant
    // (includeInactive=true) must always be fresh.
    if (!includeInactive) {
      const cached = await getCached("active");
      if (cached) {
        return NextResponse.json(cached, {
          headers: {
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          },
        });
      }
    } else {
      const admin = await checkAuth();
      if (!admin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const where = includeInactive ? {} : { isActive: true };

    const categories = await prisma.category.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        description: includeInactive ? true : false,
        displayOrder: true,
        isActive: includeInactive ? true : false,
        _count: includeInactive
          ? { select: { products: { where: { deletedAt: null } } } }
          : false,
        createdAt: includeInactive ? true : false,
        updatedAt: includeInactive ? true : false,
      },
      orderBy: { displayOrder: "asc" },
    });

    const payload = categories.map((c) => ({
      ...c,
      productCount:
        "_count" in c && typeof c._count === "object" && c._count
          ? (c._count as { products: number }).products ?? 0
          : undefined,
    }));

    if (!includeInactive) {
      await setCache("active", payload);
    }

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": includeInactive
          ? "no-store"
          : "public, s-maxage=300, stale-while-revalidate=600",
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

async function generateUniqueSlug(base: string): Promise<string> {
  let slug = base || "category";
  let attempt = 1;
  while (true) {
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (!existing) return slug;
    attempt += 1;
    slug = `${base}-${attempt}`;
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
