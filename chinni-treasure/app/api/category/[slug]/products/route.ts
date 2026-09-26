import { NextResponse } from "next/server";
import { logger } from "@/lib/axiom/server";
import { getHostFromRequest } from "@/src/lib/domain-filter";
import { listByCategory, CATEGORY_SORT_MAP } from "@/src/lib/product-read";
import { parseListQuery } from "@/src/lib/list-query";
import { catPageCache } from "@/src/lib/catalogue-cache";

const { get: getCached, set: setCache } = catPageCache;

type SortKey = "newest" | "price-asc" | "price-desc";

// GET /api/category/[slug]/products
// Public listing of active, non-deleted products in a category with pagination + sort.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);

    const parsedQuery = parseListQuery(searchParams, {
      defaultLimit: 12,
      maxLimit: 60,
      defaultSort: "newest",
      sortMap: CATEGORY_SORT_MAP,
    });
    if (parsedQuery instanceof NextResponse) return parsedQuery;
    const { page, limit } = parsedQuery;
    const sort = (parsedQuery.sort ?? "newest") as SortKey;

    const hostname = getHostFromRequest(request);

    const cacheKey = `${hostname ?? "default"}:${slug}:${page}:${limit}:${sort}`;
    const cached = await getCached(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      });
    }

    const result = await listByCategory(slug, hostname, { page, limit, sort });

    if (!result.category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }

    const payload = {
      category: result.category,
      products: result.products,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };

    await setCache(cacheKey, payload);

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    logger.error("Failed to fetch category products", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to fetch category products" },
      { status: 500 },
    );
  }
}
