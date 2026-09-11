import { NextResponse } from "next/server";
import { getHostFromRequest } from "@/src/lib/domain-filter";
import { listRecent } from "@/src/lib/product-read";
import { recentCache } from "@/src/lib/catalogue-cache";
import { parseListQuery, totalPages, type PageEnvelope } from "@/src/lib/list-query";

const { get: getCached, set: setCache } = recentCache;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsedQuery = parseListQuery(searchParams, {
      defaultLimit: 8,
      maxLimit: 20,
    });
    if (parsedQuery instanceof NextResponse) return parsedQuery;
    const { limit } = parsedQuery;

    const hostname = getHostFromRequest(request);

    const cacheKey = `${hostname ?? "default"}:${limit}`;
    const cached = await getCached(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
      });
    }

    const products = await listRecent(hostname, limit);
    const payload: PageEnvelope<{ products: typeof products }> = {
      products,
      total: products.length,
      page: 1,
      limit,
      totalPages: totalPages(products.length, limit),
    };

    await setCache(cacheKey, payload);

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (error) {
    console.error("Failed to fetch recent products:", error);
    return NextResponse.json({ error: "Failed to fetch recent products" }, { status: 500 });
  }
}
