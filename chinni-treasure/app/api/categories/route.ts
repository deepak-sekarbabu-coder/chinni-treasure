import { NextResponse } from "next/server";
import { logger } from "@/lib/axiom/server";
import { validateOr400 } from "@/src/lib/validate";
import { requireAdmin, withAdmin } from "@/src/lib/route-guard";
import { CreateCategorySchema } from "@/src/lib/api/schemas";
import { createCategory } from "@/src/lib/catalogue-write";
import { CATALOGUE_CACHE_CONTROL } from "@/src/lib/catalogue-cache";
import { listAllCategories, loadActiveCategories } from "@/src/lib/product-read";

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
        headers: { "Cache-Control": CATALOGUE_CACHE_CONTROL.categories },
      });
    }

    // Named exception to the route guard: this GET serves both audiences from
    // one handler, so it composes requireAdmin() for the same 401.
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;

    // The admin read goes through the same module as the public one — the
    // select and the `productCount` coercion are the module's, not the route's.
    return NextResponse.json(await listAllCategories(), {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    logger.error("Failed to fetch categories", {
      error: error instanceof Error ? error.message : String(error),
    });
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

    return NextResponse.json(await createCategory(parsed.data), { status: 201 });
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
