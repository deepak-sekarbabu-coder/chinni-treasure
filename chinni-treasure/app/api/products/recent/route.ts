import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getHostFromRequest, domainFilterWhere } from "@/src/lib/domain-filter";
import { createRedisCache } from "@/src/lib/redis-cache";

const MAX_LIMIT = 20;

const { get: getCached, set: setCache } = createRedisCache(60_000, "recent");

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawLimit = parseInt(searchParams.get("limit") || "8", 10);
    const limit = Number.isFinite(rawLimit)
      ? Math.min(MAX_LIMIT, Math.max(1, rawLimit))
      : 8;

    const hostname = getHostFromRequest(request);
    const domainFilter = domainFilterWhere(hostname);

    // Include the hostname because the domain filter can change the result set.
    const cacheKey = `${hostname ?? "default"}:${limit}`;
    const cached = await getCached(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
      });
    }

    const products = await prisma.product.findMany({
      where: { isActive: true, deletedAt: null, stockQuantity: { gt: 0 }, ...domainFilter },
      include: {
        category: { select: { name: true } },
        images: { orderBy: { displayOrder: "asc" } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    await setCache(cacheKey, products);

    return NextResponse.json(products, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (error) {
    console.error("Failed to fetch recent products:", error);
    return NextResponse.json({ error: "Failed to fetch recent products" }, { status: 500 });
  }
}
