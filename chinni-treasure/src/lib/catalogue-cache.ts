import { createRedisCache } from "@/src/lib/redis-cache";
import { prisma } from "@/src/lib/prisma";
import { Prisma } from "@prisma/client";
import { domainFilterWhere } from "@/src/lib/domain-filter";
import type { LatestCategorySection } from "@/src/lib/api/schemas";

/**
 * The Catalogue cache module.
 *
 * The catalogue is ONE concept: products, categories, the latest-per-category
 * block, category pages, and recent products are all invalidated together on
 * any catalogue mutation. Every namespace below is owned by this module —
 * routes import their caches from here instead of calling createRedisCache()
 * themselves, and invalidation clears exactly what this module owns (never a
 * hardcoded string list).
 *
 * The active-product index (catIndex) is loaded and cached here, so the
 * filtering/sorting vocabulary used to query that index lives here too.
 */
export const productsCache = createRedisCache(30_000, "products");
// Full active-product index per hostname; public catalogue searches filter
// this list in memory instead of querying Postgres per keystroke.
export const catIndexCache = createRedisCache(60_000, "catindex");
export const categoriesCache = createRedisCache(300_000, "categories");
export const catLatestCache = createRedisCache(60_000, "catlatest");
export const catPageCache = createRedisCache(60_000, "catpage");
export const recentCache = createRedisCache(60_000, "recent");
export const giftBoxCache = createRedisCache(60_000, "giftboxes");

const CATALOGUE_CACHES = [
  productsCache,
  catIndexCache,
  categoriesCache,
  catLatestCache,
  catPageCache,
  recentCache,
  giftBoxCache,
] as const;

/**
 * Clear every cache owned by the catalogue — the namespace in Redis (SCAN +
 * DEL) plus the module's local in-memory fallback. Call after any product or
 * category create / update / delete.
 */
export async function invalidateCatalogCaches(): Promise<void> {
  await Promise.all(CATALOGUE_CACHES.map((cache) => cache.clear()));
}

/**
 * Latest in-stock product per active category — the data behind both the
 * homepage block and GET /api/categories/latest. Owned here so the two
 * surfaces share one cached fetch instead of each hitting Postgres per
 * request. Purged with every catalogue mutation via invalidateCatalogCaches().
 * ponytail: the 60s cache is per-instance when Redis is off, so cold
 * serverless instances still pay one query per request; a CDN/ISR layer
 * needs the root-layout cookies() call removed first.
 */
export async function loadLatestCategories(): Promise<LatestCategorySection[]> {
  const cached = (await catLatestCache.get("latest")) as LatestCategorySection[] | null;
  if (cached) return cached;

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      products: {
        where: { isActive: true, deletedAt: null, stockQuantity: { gt: 0 } },
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
            select: { id: true, url: true, isPrimary: true, displayOrder: true },
          },
        },
      },
    },
  });

  const payload: LatestCategorySection[] = categories
    .filter((c) => c.products.length > 0)
    .map((c) => {
      const [product] = c.products;
      return {
        category: { id: c.id, name: c.name, slug: c.slug },
        product: {
          id: product.id,
          name: product.name,
          price: Number(product.price),
          compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
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

  await catLatestCache.set("latest", payload);
  return payload;
}

// ---------------------------------------------------------------------------
// Active-product index query surface
// ---------------------------------------------------------------------------

export type CatalogueIndexProduct = Prisma.ProductGetPayload<{
  include: { category: { select: { name: true } }; images: true };
}>;

// Sort vocabulary — single source shared by the route's DB ordering and this
// index's in-memory comparators, so the two can never drift apart.
export const SORT_OPTIONS = {
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

export type SortKey = keyof typeof SORT_OPTIONS;

// In-memory comparators, keyed to the shared vocabulary above so adding a sort
// key without a comparator here is a compile error. Ordering matches the DB
// orderBy used by the admin list: stockQuantity desc, then the chosen field,
// then id desc. Unknown keys fall back to newest.
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

function compareIndexProducts(a: CatalogueIndexProduct, b: CatalogueIndexProduct, sortParam: string): number {
  if (a.stockQuantity !== b.stockQuantity) return b.stockQuantity - a.stockQuantity;
  const { field, dir } = INDEX_SORT_FIELDS[sortParam as SortKey] ?? INDEX_SORT_FIELDS.newest;
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
  const cached = (await catIndexCache.get(key)) as CatalogueIndexProduct[] | null;
  if (cached) return cached;
  const products = await prisma.product.findMany({
    where: { isActive: true, deletedAt: null, ...domainFilterWhere(hostname) },
    include: {
      category: { select: { name: true } },
      images: { orderBy: { displayOrder: "asc" } },
    },
    orderBy: [{ stockQuantity: "desc" }, { id: "desc" }],
  });
  await catIndexCache.set(key, products);
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

export type CatalogueIndexQuery = {
  search?: string;
  categoryId?: number;
  badge?: string;
  sort?: string;
  skip: number;
  limit: number;
};

/**
 * Filter, sort, and page the in-memory active-product index. The index itself
 * is loaded once and cached; every keystroke costs no database round trip
 * after that.
 */
export async function queryCatalogueIndex(
  hostname: string | null,
  query: CatalogueIndexQuery,
): Promise<{ products: CatalogueIndexProduct[]; total: number }> {
  const index = await loadActiveIndex(hostname);
  const filtered = filterActiveIndex(index, query.search ?? "", query.categoryId, query.badge ?? "");
  const sorted = [...filtered].sort((a, b) => compareIndexProducts(a, b, query.sort ?? "newest"));
  return { products: sorted.slice(query.skip, query.skip + query.limit), total: sorted.length };
}
