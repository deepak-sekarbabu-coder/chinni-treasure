import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { sanitize } from "@/src/lib/sanitize";
import { validateOr400 } from "@/src/lib/validate";
import { productsCache, queryCatalogueIndex, invalidateCatalogCaches, SORT_OPTIONS, type SortKey } from "@/src/lib/catalogue-cache";
import { withAdmin } from "@/src/lib/admin-route";
import { z } from "zod";
import { Prisma, ProductBadge } from "@prisma/client";
import { getHostFromRequest, domainFilterWhere, normalizeVisibleHostnames } from "@/src/lib/domain-filter";
import { parseListQuery, totalPages } from "@/src/lib/list-query";

const { get: getCached, set: setCache } = productsCache;

const CreateProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.coerce.number().positive("Price must be a positive number"),
  compareAtPrice: z.coerce.number().positive("Compare at price must be positive").optional().nullable(),
  sku: z.string().optional(),
  categoryId: z.coerce.number().int().positive().optional().nullable(),
  description: z.string().optional(),
  stockQuantity: z.coerce.number().int().min(0).optional(),
  imageUrl: z.string().optional(),
  badge: z.nativeEnum(ProductBadge).optional().nullable(),
  isActive: z.boolean().optional(),
  visibleHostnames: z.string().optional(),
  allowGiftBoxBundling: z.boolean().optional(),
  images: z
    .array(
      z.object({
        url: z.string().min(1),
        isPrimary: z.boolean().optional().default(false),
        displayOrder: z.number().int().min(0).optional().default(0),
      }),
    )
    .optional(),
});

// GET /api/products — List products (optionally paginated). Public: no admin guard.
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
    const sortParam = (parsedQuery.sort ?? "newest") as SortKey;
    const sort = SORT_OPTIONS[sortParam];

    const isActiveParam = searchParams.get("isActive");
    const statusFilter = isActiveParam === "all" || isActiveParam === "inactive" ? isActiveParam : "active";
    const searchQuery = searchParams.get("search") || "";
    const rawCategoryId = searchParams.get("categoryId");
    const categoryId = rawCategoryId ? Number.parseInt(rawCategoryId, 10) : undefined;
    const badgeFilter = searchParams.get("badge") || "";

    const hostname = getHostFromRequest(request);
    const domainFilter = domainFilterWhere(hostname);

    // Public catalogue requests (active products) filter an in-memory index of
    // the full active catalogue instead of querying Postgres per request, so
    // search-as-you-type costs no database round trips after one cache load.
    if (statusFilter === "active") {
      const { products, total } = await queryCatalogueIndex(hostname, {
        search: searchQuery,
        categoryId,
        badge: badgeFilter,
        sort: sortParam,
        skip,
        limit,
      });
      return NextResponse.json(
        {
          products,
          total,
          page,
          limit,
          totalPages: totalPages(total, limit),
        },
        { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } },
      );
    }

    const where: Prisma.ProductWhereInput = statusFilter === "all"
      ? { deletedAt: null, ...domainFilter }
      : { isActive: false, deletedAt: null, ...domainFilter };

    if (searchQuery) {
      where.OR = [
        { name: { contains: searchQuery, mode: "insensitive" } },
        { sku: { contains: searchQuery, mode: "insensitive" } },
      ];
    }

    if (categoryId && Number.isFinite(categoryId)) {
      where.categoryId = categoryId;
    }

    if (badgeFilter && badgeFilter !== "all") {
      where.badge = badgeFilter as ProductBadge;
    }

    const cacheKey = `${hostname ?? "default"}:${page}:${limit}:${statusFilter}:${searchQuery}:${categoryId ?? "all"}:${badgeFilter}:${sortParam}`;
    const cached = await getCached(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
      });
    }

    // Sequential queries to avoid saturating Nhost's pooler with
    // concurrent connections.
    const products = await prisma.product.findMany({
      where,
      include: {
        category: { select: { name: true } },
        images: { orderBy: { displayOrder: "asc" } },
      },
      orderBy: sortParam === "newest"
        ? [{ stockQuantity: "desc" as const }, ...sort, { id: "desc" as const }]
        : [...sort, { id: "desc" as const }],
      skip,
      take: limit,
    });
    const total = await prisma.product.count({ where });

    const payload = {
      products,
      total,
      page,
      limit,
      totalPages: totalPages(total, limit),
    };

    await setCache(cacheKey, payload);

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

type CreateProductInput = {
  name: string;
  price: number;
  compareAtPrice?: number | null;
  sku?: string;
  categoryId?: number | null;
  description?: string;
  stockQuantity?: number;
  imageUrl?: string;
  badge?: ProductBadge | null;
  isActive?: boolean;
  visibleHostnames?: string;
  allowGiftBoxBundling?: boolean;
  images?: Array<{ url: string; isPrimary?: boolean; displayOrder?: number }>;
};

function buildCreateData(input: CreateProductInput) {
  return {
    sku: input.sku || undefined,
    name: sanitize(input.name),
    categoryId: input.categoryId ?? null,
    description: input.description ? sanitize(input.description) : null,
    price: input.price,
    compareAtPrice: input.compareAtPrice ?? null,
    stockQuantity: input.stockQuantity ?? 0,
    imageUrl: input.imageUrl || null,
    ...(input.badge !== undefined && { badge: input.badge ?? null }),
    ...(input.isActive !== undefined && { isActive: input.isActive }),
    ...(input.visibleHostnames !== undefined && { visibleHostnames: normalizeVisibleHostnames(input.visibleHostnames) }),
    ...(input.allowGiftBoxBundling !== undefined && { allowGiftBoxBundling: input.allowGiftBoxBundling }),
  };
}

// POST /api/products — Create a new product (admin only)
export const POST = withAdmin(
  async ({ body }) => {
    const parsed = validateOr400(CreateProductSchema, body);
    if (!parsed.ok) return parsed.response;

    const { images, allowGiftBoxBundling, ...productData } = parsed.data;

    // Validate gift box bundling: cannot enable on a Gift Box category product
    if (allowGiftBoxBundling && productData.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: productData.categoryId }, select: { slug: true } });
      if (category?.slug === "box") {
        return NextResponse.json(
          { error: "Gift box bundling cannot be enabled on Gift Box products" },
          { status: 400 },
        );
      }
    }

    const product = await prisma.product.create({
      data: {
        ...buildCreateData({ ...productData, allowGiftBoxBundling } as CreateProductInput),
        images: images && images.length > 0
          ? {
            create: images.map((img, idx) => ({
              url: img.url,
              isPrimary: img.isPrimary ?? idx === 0,
              displayOrder: img.displayOrder ?? idx,
            })),
          }
          : undefined,
      },
      include: {
        category: { select: { name: true } },
        images: { orderBy: { displayOrder: "asc" } },
      },
    });

    await invalidateCatalogCaches();

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
