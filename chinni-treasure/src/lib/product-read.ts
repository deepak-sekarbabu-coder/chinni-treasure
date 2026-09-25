import {
  SORT_OPTIONS,
  categoriesCache,
  productsCache,
  queryCatalogueIndex,
  type CatalogueIndexProduct,
  type SortKey,
} from "@/src/lib/catalogue-cache";
import { prisma } from "@/src/lib/prisma";
import { Prisma, ProductBadge } from "@prisma/client";
import { domainFilterWhere, isVisibleOnDomain } from "@/src/lib/domain-filter";
import { totalPages } from "@/src/lib/list-query";
import { unstable_cache } from "next/cache";

const INCLUDE = {
  category: { select: { name: true } },
  images: { orderBy: { displayOrder: "asc" } },
} satisfies Prisma.ProductInclude;

type ProductRow = Prisma.ProductGetPayload<{ include: typeof INCLUDE }>;

export type ProductView = {
  id: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
  description: string | null;
  category: { name: string } | null;
  categoryId: number | null;
  stockQuantity: number;
  badge: string | null;
  sku: string | null;
  isActive: boolean;
  allowGiftBoxBundling?: boolean;
  createdAt: string;
  updatedAt?: string;
  images?: { id: string; url: string; isPrimary: boolean; displayOrder: number }[];
};

export type CatalogueProductView = {
  id: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
  description: string | null;
  category: { name: string } | null;
  stockQuantity: number;
  badge: string | null;
  sku: string | null;
  allowGiftBoxBundling?: boolean;
  images?: { id: string; url: string; isPrimary: boolean; displayOrder: number }[];
};

// The category page's allowed sort keys, read straight from the shared
// catalogue sort table — an allow-list, not a re-declaration of the rule.
export const CATEGORY_SORT_MAP = {
  newest: SORT_OPTIONS.newest,
  "price-asc": SORT_OPTIONS["price-asc"],
  "price-desc": SORT_OPTIONS["price-desc"],
} as const;

export type ActiveCategoryOption = {
  id: number;
  name: string;
  slug: string;
  displayOrder: number;
};

/**
 * Active categories for the catalogue filter dropdown / public /api/categories,
 * cached through the module-owned `categoriesCache` under the same `active` key
 * both consumers share — one pipeline, one invalidation hit. The shape matches
 * the public API contract exactly (id/name/slug/displayOrder).
 */
export async function loadActiveCategories(): Promise<ActiveCategoryOption[]> {
  const cached = (await categoriesCache.get("active")) as ActiveCategoryOption[] | null;
  if (cached) return cached;
  const rows = await prisma.category.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true, displayOrder: true },
    orderBy: { displayOrder: "asc" },
  });
  await categoriesCache.set("active", rows);
  return rows;
}

function toProductView(row: ProductRow): ProductView {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    compareAtPrice: row.compareAtPrice ? Number(row.compareAtPrice) : null,
    imageUrl: row.imageUrl ?? null,
    description: row.description ?? null,
    category: row.category,
    categoryId: row.categoryId,
    stockQuantity: row.stockQuantity,
    badge: row.badge,
    sku: row.sku,
    isActive: row.isActive,
    allowGiftBoxBundling: row.allowGiftBoxBundling,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt?.toISOString(),
    images: row.images.map((img) => ({
      id: img.id,
      url: img.url,
      isPrimary: img.isPrimary,
      displayOrder: img.displayOrder,
    })),
  };
}

function toCatalogueProductView(row: ProductRow): CatalogueProductView {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    compareAtPrice: row.compareAtPrice ? Number(row.compareAtPrice) : null,
    imageUrl: row.imageUrl ?? null,
    description: row.description ?? null,
    category: row.category,
    stockQuantity: row.stockQuantity,
    badge: row.badge,
    sku: row.sku,
    allowGiftBoxBundling: row.allowGiftBoxBundling,
    images: row.images.map((img) => ({
      id: img.id,
      url: img.url,
      isPrimary: img.isPrimary,
      displayOrder: img.displayOrder,
    })),
  };
}

// ---------------------------------------------------------------------------
// Product detail read
// ---------------------------------------------------------------------------

/**
 * What the product-detail surface renders. The row keeps its raw image pieces
 * (`imageUrl`, `images`) — the display seam (product-display.ts) resolves "the
 * primary image" from them once, so the gallery, JSON-LD and og/twitter all
 * read the same picker instead of three loosely-agreeing computations.
 * `price`/`compareAtPrice` are numbers and the nullable columns are already
 * coerced to the strings the component takes, so the page passes this object
 * straight through.
 */
export type ProductDetailView = {
  id: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string;
  description: string;
  category: { name: string } | null;
  stockQuantity: number;
  badge: string | null;
  sku: string | null;
  allowGiftBoxBundling: boolean;
  images: { id: string; url: string; isPrimary: boolean; displayOrder: number }[];
};

const getProductRow = unstable_cache(
  async (id: string) => prisma.product.findUnique({ where: { id }, include: INCLUDE }),
  ["product-by-id"],
  {
    revalidate: 60,
    // Cleared by invalidateCatalogCaches() (revalidateTag) on any catalogue
    // mutation so an admin edit is visible immediately.
    tags: ["product-detail"],
  },
);

function toProductDetailView(row: ProductRow): ProductDetailView {
  const images = row.images.map((img) => ({
    id: img.id,
    url: img.url,
    isPrimary: img.isPrimary,
    displayOrder: img.displayOrder,
  }));
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    compareAtPrice: row.compareAtPrice ? Number(row.compareAtPrice) : null,
    imageUrl: row.imageUrl ?? "",
    description: row.description ?? "",
    category: row.category,
    stockQuantity: row.stockQuantity,
    badge: row.badge,
    sku: row.sku,
    allowGiftBoxBundling: row.allowGiftBoxBundling,
    images,
  };
}

/**
 * The one product-detail read. The row is cached by id (module-owned tag), but
 * the active / soft-deleted / domain checks run *outside* the cache: caching
 * the verdict would serve one host's visibility decision to every host. Null
 * means "this surface must not show the product" — the page just notFound()s.
 */
export async function getProductDetail(id: string, hostname: string | null): Promise<ProductDetailView | null> {
  const row = await getProductRow(id);
  if (!row || !row.isActive || row.deletedAt) return null;
  if (!isVisibleOnDomain(row.visibleHostnames, hostname)) return null;
  return toProductDetailView(row);
}

// ---------------------------------------------------------------------------
// Product list read
// ---------------------------------------------------------------------------

export type ProductStatusFilter = "active" | "all" | "inactive";

export type ProductListQuery = {
  page: number;
  limit: number;
  skip: number;
  status: ProductStatusFilter;
  search: string;
  categoryId?: number;
  badge: string;
  sort: SortKey;
};

export type ProductListResult = {
  products: ProductRow[] | CatalogueIndexProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

/**
 * The one public product-list read, owning the status gate, the where-builder,
 * the cache key, and the envelope. The active catalogue queries the in-memory
 * index (no Postgres round trip per keystroke); `all` / `inactive` — the admin
 * panel's view, and nothing else — reads Postgres through the module-owned
 * cache. The route parses the URL, checks the session, and hands back JSON.
 */
export async function listProductsForQuery(hostname: string | null, query: ProductListQuery): Promise<ProductListResult> {
  const { page, limit, skip, status, search, categoryId, badge, sort } = query;
  const envelope = (products: ProductRow[] | CatalogueIndexProduct[], total: number): ProductListResult => ({
    products,
    total,
    page,
    limit,
    totalPages: totalPages(total, limit),
  });

  if (status === "active") {
    const { products, total } = await queryCatalogueIndex(hostname, {
      search,
      categoryId,
      badge,
      sort,
      skip,
      limit,
    });
    return envelope(products, total);
  }

  const where: Prisma.ProductWhereInput =
    status === "all"
      ? { deletedAt: null, ...domainFilterWhere(hostname) }
      : { isActive: false, deletedAt: null, ...domainFilterWhere(hostname) };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
    ];
  }
  if (categoryId && Number.isFinite(categoryId)) where.categoryId = categoryId;
  if (badge && badge !== "all") where.badge = badge as ProductBadge;

  const cacheKey = `${hostname ?? "default"}:${page}:${limit}:${status}:${search}:${categoryId ?? "all"}:${badge}:${sort}`;
  const cached = (await productsCache.get(cacheKey)) as ProductListResult | null;
  if (cached) return cached;

  // Sequential queries to avoid saturating Nhost's pooler with concurrent
  // connections.
  const products = await prisma.product.findMany({
    where,
    include: INCLUDE,
    orderBy: [...SORT_OPTIONS[sort]],
    skip,
    take: limit,
  });
  const total = await prisma.product.count({ where });

  const result = envelope(products, total);
  await productsCache.set(cacheKey, result);
  return result;
}

export async function listCatalogue(
  hostname: string | null,
  categoryId?: number,
): Promise<{ products: CatalogueProductView[]; total: number }> {
  // Cache-through through the module-owned productsCache. The key is host +
  // category only — the reset of the query (listCatalogue has no search) never
  // varies, so a search param must not enter the key (that was the old
  // per-URL cache thrash). Invalidation is the module's own.
  const cacheKey = `${hostname ?? "default"}:list:${categoryId ?? "all"}`;
  const cached = (await productsCache.get(cacheKey)) as { products: CatalogueProductView[]; total: number } | null;
  if (cached) return cached;

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    deletedAt: null,
    ...(categoryId ? { categoryId } : {}),
    ...domainFilterWhere(hostname),
  };

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: INCLUDE,
      orderBy: [...SORT_OPTIONS.newest],
      take: 6,
      skip: 0,
    }),
    prisma.product.count({ where }),
  ]);

  const result = { products: rows.map(toCatalogueProductView), total };
  await productsCache.set(cacheKey, result);
  return result;
}

export async function listByCategory(
  slug: string,
  hostname: string | null,
  opts: { page?: number; limit?: number; sort?: string } = {},
): Promise<{
  category: { id: number; name: string; slug: string; description: string | null; isActive: boolean } | null;
  products: ProductView[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(60, Math.max(1, opts.limit ?? 12));
  const skip = (page - 1) * limit;

  const sortKey = opts.sort ?? "newest";
  const orderBy = [...(CATEGORY_SORT_MAP[sortKey as keyof typeof CATEGORY_SORT_MAP] ?? SORT_OPTIONS.newest)];

  const category = await prisma.category.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, description: true, isActive: true },
  });

  if (!category || !category.isActive) {
    return { category: null, products: [], total: 0, page, limit, totalPages: 1 };
  }

  const where: Prisma.ProductWhereInput = {
    categoryId: category.id,
    isActive: true,
    deletedAt: null,
    ...domainFilterWhere(hostname),
  };

  const [rows, total] = await Promise.all([
    prisma.product.findMany({ where, include: INCLUDE, orderBy, skip, take: limit }),
    prisma.product.count({ where }),
  ]);

  return {
    category,
    products: rows.map(toProductView),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function listGiftBoxes(): Promise<
  { id: string; name: string; price: number; imageUrl: string | null; stockQuantity: number }[]
> {
  const rows = await prisma.product.findMany({
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
      images: { where: { isPrimary: true }, select: { url: true }, take: 1 },
    },
    orderBy: { name: "asc" },
  });

  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    imageUrl: p.images[0]?.url || p.imageUrl,
    stockQuantity: p.stockQuantity,
  }));
}
