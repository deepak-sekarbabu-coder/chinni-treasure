import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/src/lib/prisma";
import { checkAuth } from "@/src/lib/auth";
import { sanitize } from "@/src/lib/sanitize";
import { validateCsrfOrigin } from "@/src/lib/csrf";
import { validateOr400 } from "@/src/lib/validate";
import { productsCache, catIndexCache, invalidateCatalogCaches } from "@/src/lib/catalogue-cache";
import { z } from "zod";
import { Prisma, ProductBadge } from "@prisma/client";
import { getHostFromRequest, domainFilterWhere } from "@/src/lib/domain-filter";

const { get: getCached, set: setCache } = productsCache;
const { get: getIndexCached, set: setIndexCache } = catIndexCache;

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

type CatalogueIndexProduct = Prisma.ProductGetPayload<{
  include: { category: { select: { name: true } }; images: true };
}>;

const INDEX_SORT_FIELDS: Record<
  SortKey,
  { field: (p: CatalogueIndexProduct) => string | number | null; dir: 1 | -1 }
> = {
  newest: { field: (p) => new Date(p.createdAt).getTime(), dir: -1 },
  oldest: { field: (p) => new Date(p.createdAt).getTime(), dir: 1 },
  "name-asc": { field: (p) => p.name, dir: 1 },
  "name-desc": { field: (p) => p.name, dir: -1 },
  "price-asc": { field: (p) => Number(p.price), dir: 1 },
  "price-desc": { field: (p) => Number(p.price), dir: -1 },
  "stock-desc": { field: (p) => p.stockQuantity, dir: -1 },
  "stock-asc": { field: (p) => p.stockQuantity, dir: 1 },
  "sku-asc": { field: (p) => p.sku, dir: 1 },
  "sku-desc": { field: (p) => p.sku, dir: -1 },
};

// Mirrors the DB ordering: stockQuantity desc, then the chosen sort, then id desc.
function compareIndexProducts(a: CatalogueIndexProduct, b: CatalogueIndexProduct, sortParam: SortKey): number {
  if (a.stockQuantity !== b.stockQuantity) return b.stockQuantity - a.stockQuantity;
  const { field, dir } = INDEX_SORT_FIELDS[sortParam] ?? INDEX_SORT_FIELDS.newest;
  const av = field(a);
  const bv = field(b);
  if (av !== bv) {
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === "string" || typeof bv === "string") {
      const cmp = String(av).localeCompare(String(bv));
      if (cmp !== 0) return cmp * dir;
    } else {
      return ((av as number) - (bv as number)) * dir;
    }
  }
  return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
}

async function loadActiveIndex(hostname: string | null): Promise<CatalogueIndexProduct[]> {
  const key = `${hostname ?? "default"}:active`;
  const cached = (await getIndexCached(key)) as CatalogueIndexProduct[] | null;
  if (cached) return cached;
  const products = await prisma.product.findMany({
    where: { isActive: true, deletedAt: null, ...domainFilterWhere(hostname) },
    include: {
      category: { select: { name: true } },
      images: { orderBy: { displayOrder: "asc" } },
    },
    orderBy: [{ stockQuantity: "desc" }, { id: "desc" }],
  });
  await setIndexCache(key, products);
  return products;
}

function filterActiveIndex(
  index: CatalogueIndexProduct[],
  searchQuery: string,
  categoryId: number | undefined,
  badgeFilter: string,
): CatalogueIndexProduct[] {
  let filtered = index;
  const needle = searchQuery.toLowerCase();
  if (needle) {
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(needle) ||
        (p.sku ?? "").toLowerCase().includes(needle),
    );
  }
  if (categoryId && Number.isFinite(categoryId)) {
    filtered = filtered.filter((p) => p.categoryId === categoryId);
  }
  if (badgeFilter && badgeFilter !== "all") {
    filtered = filtered.filter((p) => p.badge === badgeFilter);
  }
  return filtered;
}

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
    const statusFilter = isActiveParam === "all" || isActiveParam === "inactive" ? isActiveParam : "active";
    const searchQuery = searchParams.get("search") || "";
    const rawCategoryId = searchParams.get("categoryId");
    const categoryId = rawCategoryId ? Number.parseInt(rawCategoryId, 10) : undefined;
    const badgeFilter = searchParams.get("badge") || "";
    const sortParam = (searchParams.get("sort") || "newest") as SortKey;
    const sort = SORT_OPTIONS[sortParam] ?? SORT_OPTIONS.newest;

    const hostname = getHostFromRequest(request);
    const domainFilter = domainFilterWhere(hostname);

    // Public catalogue requests (active products) filter an in-memory index of
    // the full active catalogue instead of querying Postgres per request, so
    // search-as-you-type costs no database round trips after one cache load.
    if (statusFilter === "active") {
      const index = await loadActiveIndex(hostname);
      const filtered = filterActiveIndex(index, searchQuery, categoryId, badgeFilter);
      const sorted = [...filtered].sort((a, b) => compareIndexProducts(a, b, sortParam));
      const total = sorted.length;
      return NextResponse.json(
        {
          products: sorted.slice(skip, skip + limit),
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
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
    ...(input.visibleHostnames !== undefined && { visibleHostnames: input.visibleHostnames || null }),
    ...(input.allowGiftBoxBundling !== undefined && { allowGiftBoxBundling: input.allowGiftBoxBundling }),
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
    revalidatePath("/catalogue");
    revalidatePath("/");
    revalidatePath("/category", "layout");

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
