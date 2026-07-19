import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { Prisma } from "@prisma/client";

const MAX_LIMIT = 60;

type SortKey = "newest" | "price-asc" | "price-desc";

const SORT_MAP: Record<SortKey, Prisma.ProductOrderByWithRelationInput[]> = {
  newest: [{ stockQuantity: "desc" }, { createdAt: "desc" }, { id: "desc" }],
  "price-asc": [{ stockQuantity: "desc" }, { price: "asc" }, { id: "asc" }],
  "price-desc": [{ stockQuantity: "desc" }, { price: "desc" }, { id: "desc" }],
};

// GET /api/category/[slug]/products
// Public listing of active, non-deleted products in a category with pagination + sort.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);

    const rawPage = parseInt(searchParams.get("page") || "1", 10);
    const rawLimit = parseInt(searchParams.get("limit") || "12", 10);
    const page = Number.isFinite(rawPage) ? Math.max(1, rawPage) : 1;
    const limit = Number.isFinite(rawLimit)
      ? Math.min(MAX_LIMIT, Math.max(1, rawLimit))
      : 12;
    const skip = (page - 1) * limit;

    const rawSort = searchParams.get("sort") || "newest";
    const sort: SortKey = (SORT_MAP as Record<string, unknown>)[rawSort]
      ? (rawSort as SortKey)
      : "newest";

    const category = await prisma.category.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true, description: true, isActive: true },
    });

    if (!category || !category.isActive) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }

    const where: Prisma.ProductWhereInput = {
      categoryId: category.id,
      isActive: true,
      deletedAt: null,
    };

    // Sequential queries to avoid saturating Nhost's pooler with
    // concurrent connections.
    const products = await prisma.product.findMany({
      where,
      include: {
        category: { select: { name: true } },
        images: { orderBy: { displayOrder: "asc" } },
      },
      orderBy: SORT_MAP[sort],
      skip,
      take: limit,
    });
    const total = await prisma.product.count({ where });

    const payload = {
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        isActive: category.isActive,
      },
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
        imageUrl: p.imageUrl ?? null,
        description: p.description ?? null,
        stockQuantity: p.stockQuantity,
        badge: p.badge ?? null,
        category: p.category,
        categoryId: p.categoryId,
        sku: p.sku,
        isActive: p.isActive,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        images: p.images.map((img) => ({
          id: img.id,
          url: img.url,
          isPrimary: img.isPrimary,
          displayOrder: img.displayOrder,
        })),
      })),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("Failed to fetch category products:", error);
    return NextResponse.json(
      { error: "Failed to fetch category products" },
      { status: 500 },
    );
  }
}
