import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { giftBoxCache } from "@/src/lib/catalogue-cache";

const { get: getCached, set: setCache } = giftBoxCache;

// GET /api/gift-boxes — List active gift-box products (public)
export async function GET() {
  try {
    const cacheKey = "all";
    const cached = await getCached(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
      });
    }

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        stockQuantity: { gt: 0 },
        category: { slug: "box" },
      },
      select: {
        id: true,
        name: true,
        price: true,
        imageUrl: true,
        stockQuantity: true,
        images: {
          where: { isPrimary: true },
          select: { url: true },
          take: 1,
        },
      },
      orderBy: { name: "asc" },
    });

    const payload = products.map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      imageUrl: p.images[0]?.url || p.imageUrl,
      stockQuantity: p.stockQuantity,
    }));

    await setCache(cacheKey, payload);

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (error) {
    console.error("Failed to fetch gift boxes:", error);
    return NextResponse.json({ error: "Failed to fetch gift boxes" }, { status: 500 });
  }
}
