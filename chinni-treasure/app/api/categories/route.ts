import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/src/lib/prisma";
import { checkAuth } from "@/src/lib/auth";
import { sanitize } from "@/src/lib/sanitize";
import { validateCsrfOrigin } from "@/src/lib/csrf";
import { categoriesCache, invalidateCatalogCaches } from "@/src/lib/catalogue-cache";
import { Prisma } from "@prisma/client";
import { CreateCategorySchema } from "@/src/lib/api/schemas";

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

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
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
export async function POST(request: Request) {
  const csrfError = validateCsrfOrigin(request);
  if (csrfError) return csrfError;

  const admin = await checkAuth();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = CreateCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 },
      );
    }

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
    revalidatePath("/catalogue");
    revalidatePath("/");
    revalidatePath("/category", "layout");

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Failed to create category:", error);
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
      { error: "Failed to create category" },
      { status: 500 },
    );
  }
}
