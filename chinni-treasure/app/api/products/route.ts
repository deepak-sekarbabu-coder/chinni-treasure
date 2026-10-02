import { NextResponse } from "next/server";
import { logger } from "@/lib/axiom/server";
import { prisma } from "@/src/lib/prisma";
import { validateOr400 } from "@/src/lib/validate";
import { CATALOGUE_CACHE_CONTROL, SORT_OPTIONS, type SortKey } from "@/src/lib/catalogue-cache";
import { requireAdmin, withAdmin } from "@/src/lib/route-guard";
import { getHostFromRequest } from "@/src/lib/domain-filter";
import { parseListQuery } from "@/src/lib/list-query";
import { assertGiftBoxNotOnBox, buildCreateData } from "@/src/lib/catalogue-write";
import { normalizeImageSet } from "@/src/lib/image-set";
import { ProductInputSchema } from "@/src/lib/api/schemas";
import { listProductsForQuery, type ProductStatusFilter } from "@/src/lib/product-read";

// GET /api/products — List products (optionally paginated). The active
// catalogue is public; `isActive=all|inactive` requires an admin session.
// Named exception to the route guard: this GET serves both audiences from one
// handler (Next allows one exported GET), so it composes requireAdmin() and
// keeps its own failure envelope rather than being wrapped.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsedQuery = parseListQuery(searchParams, {
      defaultLimit: 10,
      maxLimit: 100,
      defaultSort: "newest",
      sortMap: SORT_OPTIONS,
    });
    if (parsedQuery instanceof NextResponse) return parsedQuery;
    const { page, limit, skip } = parsedQuery;
    const isActiveParam = searchParams.get("isActive");
    const status: ProductStatusFilter =
      isActiveParam === "all" || isActiveParam === "inactive" ? isActiveParam : "active";

    // Only the active catalogue is public. `all` / `inactive` is the admin
    // panel's view of the catalogue, so it is gated here — at the one seam
    // both audiences read through — rather than inside any branch the module
    // owns. Without this an anonymous caller could enumerate inactive products
    // by appending a query param.
    if (status !== "active") {
      const admin = await requireAdmin();
      if (admin instanceof NextResponse) return admin;
    }

    const rawCategoryId = searchParams.get("categoryId");
    const payload = await listProductsForQuery(getHostFromRequest(request), {
      page,
      limit,
      skip,
      status,
      search: searchParams.get("search") || "",
      categoryId: rawCategoryId ? Number.parseInt(rawCategoryId, 10) : undefined,
      badge: searchParams.get("badge") || "",
      sort: (parsedQuery.sort ?? "newest") as SortKey,
    });

    return NextResponse.json(
      payload,
      // The admin responses are keyed by URL alone, which says nothing about
      // the session that was allowed to see them — a shared edge cache would
      // hand them to anonymous callers.
      status === "active"
        ? { headers: { "Cache-Control": CATALOGUE_CACHE_CONTROL.products } }
        : { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    logger.error("Failed to fetch products", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

// POST /api/products — Create a new product (admin only)
export const POST = withAdmin(
  async ({ body }) => {
    const parsed = validateOr400(ProductInputSchema, body);
    if (!parsed.ok) return parsed.response;

    const { images, allowGiftBoxBundling, ...productData } = parsed.data;

    if (allowGiftBoxBundling) {
      await assertGiftBoxNotOnBox(productData.categoryId ?? null);
    }

    // The image-set module owns the "one primary, contiguous order" invariant;
    // the old `isPrimary ?? idx === 0` was dead (Zod defaults it false), so two
    // primaries could be stored.
    const imageSet = images ? normalizeImageSet(images) : [];

    const product = await prisma.product.create({
      data: {
        ...buildCreateData({ ...productData, allowGiftBoxBundling }),
        images: imageSet.length > 0
          ? { create: imageSet }
          : undefined,
      },
      include: {
        category: { select: { name: true } },
        images: { orderBy: { displayOrder: "asc" } },
      },
    });

    return NextResponse.json(product, { status: 201 });
  },
  {
    parseBody: true,
    revalidateCatalogue: true,
    fallbackError: "Failed to create product",
    errorMessages: {
      p2002: (target) => `A product with this ${target} already exists`,
    },
  },
);
