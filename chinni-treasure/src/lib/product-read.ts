import { SORT_OPTIONS, categoriesCache, productsCache } from "@/src/lib/catalogue-cache";
import { prisma } from "@/src/lib/prisma";
import { Prisma } from "@prisma/client";
import { domainFilterWhere } from "@/src/lib/domain-filter";

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
