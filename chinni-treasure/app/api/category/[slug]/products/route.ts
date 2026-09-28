import { NextResponse } from "next/server";
import { getHostFromRequest } from "@/src/lib/domain-filter";
import { listByCategory } from "@/src/lib/product-read";
import { CATEGORY_SORT_MAP, type CategorySortKey } from "@/src/lib/sort-contract";
import { parseListQuery } from "@/src/lib/list-query";
import { withPublic } from "@/src/lib/route-guard";

const RESPONSE_HEADERS = {
  headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
};

// GET /api/category/[slug]/products
// Public listing of active, non-deleted products in a category with pagination + sort.
export const GET = withPublic<{ slug: string }>(
  async ({ request, params }) => {
    const { searchParams } = new URL(request.url);

    const parsedQuery = parseListQuery(searchParams, {
      defaultLimit: 12,
      maxLimit: 60,
      defaultSort: "newest",
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
