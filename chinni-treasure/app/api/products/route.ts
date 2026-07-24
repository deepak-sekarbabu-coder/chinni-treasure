import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/src/lib/prisma";
import { checkAuth } from "@/src/lib/auth";
import { sanitize } from "@/src/lib/sanitize";
import { validateCsrfOrigin } from "@/src/lib/csrf";
import { getCached, setCache, clearCache } from "@/src/lib/products-cache";
import { z } from "zod";
import { Prisma, ProductBadge } from "@prisma/client";

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

const SORT_OPTIONS = {
  newest: [{ createdAt: "desc" as const }],
  oldest: [{ createdAt: "asc" as const }],
  "name-asc": [{ name: "asc" as const }],
  "name-desc": [{ name: "desc" as const }],
  "price-asc": [{ price: "asc" as const }],
  "price-desc": [{ price: "desc" as const }],
  "stock-desc": [{ stockQuantity: "desc" as const }],
  "stock-asc": [{ stockQuantity: "asc" as const }],
  "sku-asc": [{ sku: "asc" as const }],
  "sku-desc": [{ sku: "desc" as const }],
} as const;

type SortKey = keyof typeof SORT_OPTIONS;

// GET /api/products — List products (optionally paginated)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawPage = parseInt(searchParams.get("page") || "1", 10);
    const rawLimit = parseInt(searchParams.get("limit") || "10", 10);
    const page = Number.isFinite(rawPage) ? Math.max(1, rawPage) : 1;
    const limit = Number.isFinite(rawLimit) ? Math.min(100, Math.max(1, rawLimit)) : 10;
    const skip = (page - 1) * limit;

    const isActiveParam = searchParams.get("isActive");
    const searchQuery = searchParams.get("search") || "";
    const rawCategoryId = searchParams.get("categoryId");
    const categoryId = rawCategoryId ? Number.parseInt(rawCategoryId, 10) : undefined;
    const badgeFilter = searchParams.get("badge") || "";
    const sortParam = (searchParams.get("sort") || "newest") as SortKey;
    const sort = SORT_OPTIONS[sortParam] ?? SORT_OPTIONS.newest;

    const where: Prisma.ProductWhereInput = isActiveParam === "all"
      ? { deletedAt: null }
      : { isActive: true, deletedAt: null };

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

    const cacheKey = `products:${page}:${limit}:${isActiveParam || "active"}:${searchQuery}:${categoryId ?? "all"}:${badgeFilter}:${sortParam}`;
    const cached = getCached(cacheKey);
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
      orderBy: [{ stockQuantity: "desc" }, ...sort, { id: "desc" }],
      skip,
      take: limit,
    });
    const total = await prisma.product.count({ where });

    const payload = {
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    setCache(cacheKey, payload);

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
  };
}

// POST /api/products — Create a new product (admin only)
export async function POST(request: Request) {
  const csrfError = validateCsrfOrigin(request);
  if (csrfError) return csrfError;

  const admin = await checkAuth();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = CreateProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 },
      );
    }

    const { images, ...productData } = parsed.data;
    const product = await prisma.product.create({
      data: {
        ...buildCreateData(productData as CreateProductInput),
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

    clearCache();
    revalidatePath("/catalogue");

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Failed to create product:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        const target = (error.meta?.target as string[])?.join(", ") || "field";
        return NextResponse.json({ error: `A product with this ${target} already exists` }, { status: 409 });
      }
    }
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
