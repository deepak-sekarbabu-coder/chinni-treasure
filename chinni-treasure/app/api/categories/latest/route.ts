import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

const RETRY_COUNT = 2;

async function queryWithRetry<T>(
  fn: () => Promise<T>,
  retries = RETRY_COUNT,
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(
        `[categories/latest] Query attempt ${attempt + 1} failed, retrying...`,
      );
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  throw new Error("unreachable");
}

// GET /api/categories/latest
// Returns the newest in-stock, active product for every active category.
// Uses a single nested query (one DB round trip) with `take: 1` per category
// relation to avoid N+1 queries as the number of categories grows.
export async function GET() {
  try {
    const categories = await queryWithRetry(() =>
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          products: {
            where: {
              isActive: true,
              deletedAt: null,
              stockQuantity: { gt: 0 },
            },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              name: true,
              price: true,
              compareAtPrice: true,
              imageUrl: true,
              description: true,
              stockQuantity: true,
              badge: true,
              images: {
                orderBy: { displayOrder: "asc" },
                select: {
                  id: true,
                  url: true,
                  isPrimary: true,
                  displayOrder: true,
                },
              },
            },
          },
        },
      }),
    );

    // Filter out categories that have no eligible product, and map to the
    // requested { category, product } envelope.
    const payload = categories
      .filter((c) => c.products.length > 0)
      .map((c) => {
        const [product] = c.products;
        return {
          category: { id: c.id, name: c.name, slug: c.slug },
          product: {
            id: product.id,
            name: product.name,
            price: Number(product.price),
            compareAtPrice: product.compareAtPrice
              ? Number(product.compareAtPrice)
              : null,
            imageUrl: product.imageUrl ?? null,
            description: product.description ?? null,
            stockQuantity: product.stockQuantity,
            badge: product.badge ?? null,
            images: product.images.map((img) => ({
              id: img.id,
              url: img.url,
              isPrimary: img.isPrimary,
              displayOrder: img.displayOrder,
            })),
          },
        };
      });

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("Failed to fetch latest category products:", error);
    return NextResponse.json(
      { error: "Failed to fetch latest category products" },
      { status: 500 },
    );
  }
}
