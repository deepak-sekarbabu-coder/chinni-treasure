import { NextResponse } from "next/server";
import { getHostFromRequest } from "@/src/lib/domain-filter";
import { listByCategory } from "@/src/lib/product-read";
import { CATEGORY_SORT_MAP, type CategorySortKey } from "@/src/lib/sort-contract";
import { CATALOGUE_CACHE_CONTROL } from "@/src/lib/catalogue-cache";
import { parseListQuery } from "@/src/lib/list-query";
import { withPublic } from "@/src/lib/route-guard";
import { LIST_QUERY_LIMITS } from "@/src/lib/constants";

const RESPONSE_HEADERS = {
  headers: { "Cache-Control": CATALOGUE_CACHE_CONTROL.categoryPage },
};

// GET /api/category/[slug]/products
// Public listing of active, non-deleted products in a category with pagination + sort.
export const GET = withPublic<{ slug: string }>(
  async ({ request, params }) => {
    const { searchParams } = new URL(request.url);

    const parsedQuery = parseListQuery(searchParams, {
      ...LIST_QUERY_LIMITS.categoryProducts,
      sortMap: CATEGORY_SORT_MAP,
    });
    if (parsedQuery instanceof NextResponse) return parsedQuery;
    const { page, limit } = parsedQuery;
    const sort = (parsedQuery.sort ?? "newest") as CategorySortKey;

    const result = await listByCategory(params.slug, getHostFromRequest(request), {
      page,
      limit,
      sort,
    });

    if (!result.category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json(result, RESPONSE_HEADERS);
  },
  { fallbackError: "Failed to fetch category products" },
);
