import { createRedisCache } from "@/src/lib/redis-cache";
import { prisma } from "@/src/lib/prisma";
import { Prisma } from "@prisma/client";
import { domainFilterWhere } from "@/src/lib/domain-filter";
import { revalidateTag } from "next/cache";
import type { LatestCategorySection } from "@/src/lib/api/schemas";

/**
 * The Catalogue cache module.
 *
 * The catalogue is ONE concept: products, categories, the latest-per-category
 * block, and category pages are all invalidated together on
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
export const giftBoxCache = createRedisCache(60_000, "giftboxes");

const CATALOGUE_CACHES = [
  productsCache,
  catIndexCache,
  categoriesCache,
  catLatestCache,
  catPageCache,
  giftBoxCache,
] as const;

/**
 * Clear every cache owned by the catalogue — the namespace in Redis (SCAN +
 * DEL) plus the module's local in-memory fallback. Call after any product or
 * category create / update / delete.
 *
 * Also revalidates the SSR product-detail page (app/catalogue/[id]), which
 * reads through Next's data cache (unstable_cache) rather than Redis — without
 * this tag it would keep serving a stale product for up to 60s after an edit.
 */
export async function invalidateCatalogCaches(): Promise<void> {
  await Promise.all(CATALOGUE_CACHES.map((cache) => cache.clear()));
  // expire: 0 purges the tagged product-detail cache immediately.
  revalidateTag("product-detail", { expire: 0 });
}

/**
 * Latest in-stock product per active category — the data behind both the
 * homepage block and GET /api/categories/latest. Owned here so the two
 * surfaces share one cached fetch instead of each hitting Postgres per
 * request. Purged with every catalogue mutation via invalidateCatalogCaches().
 * ponytail: the 60s cache is per-instance when Redis is off, so cold
 * serverless instances still pay one query per request; a CDN/ISR layer
 * needs the root-layout cookies() call removed first.
 * retrigger: if the prod boot warning in instrumentation.ts fires while
 * deployed (REDIS_URL would be set) — first set REDIS_URL, no code change;
 * only pursue the ISR path if Redis is in place and cold-start latency shows.
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

// Sort vocabulary — the ONE order contract for the catalogue. Every entry is a
// complete orderBy: in-stock first, then the chosen field, then id desc. The
// /api/products DB branch, the category pages (product-read), and this index's
// in-memory comparator all derive from these exact arrays, so changing the
// rule means editing this table — the three can't drift apart.
export const SORT_OPTIONS = {
  newest: [{ stockQuantity: "desc" as const }, { createdAt: "desc" as const }, { id: "desc" as const }],
  oldest: [{ stockQuantity: "desc" as const }, { createdAt: "asc" as const }, { id: "desc" as const }],
  "name-asc": [{ stockQuantity: "desc" as const }, { name: "asc" as const }, { id: "desc" as const }],
  "name-desc": [{ stockQuantity: "desc" as const }, { name: "desc" as const }, { id: "desc" as const }],
  "price-asc": [{ stockQuantity: "desc" as const }, { price: "asc" as const }, { id: "desc" as const }],
  "price-desc": [{ stockQuantity: "desc" as const }, { price: "desc" as const }, { id: "desc" as const }],
  "stock-desc": [{ stockQuantity: "desc" as const }, { stockQuantity: "asc" as const }, { id: "desc" as const }],
  "stock-asc": [{ stockQuantity: "desc" as const }, { stockQuantity: "asc" as const }, { id: "desc" as const }],
  "sku-asc": [{ stockQuantity: "desc" as const }, { sku: "asc" as const }, { id: "desc" as const }],
  "sku-desc": [{ stockQuantity: "desc" as const }, { sku: "desc" as const }, { id: "desc" as const }],
} as const;

export type SortKey = keyof typeof SORT_OPTIONS;

function sortFieldValue(p: CatalogueIndexProduct, field: string): string | number | null {
  switch (field) {
    case "stockQuantity":
      return p.stockQuantity;
    case "createdAt":
      // Redis round-trips turn the Date into an ISO string; new Date() handles both.
      return new Date(p.createdAt).getTime();
    case "name":
      return p.name;
    case "price":
      // Redis round-trips turn the Decimal into a string; Number() normalizes it.
      return Number(p.price);
    case "sku":
      return p.sku;
    case "id":
      return p.id;
  }
  return null;
}

// In-memory comparator driven by the same SORT_OPTIONS orderBy arrays the SQL
// branches use, so the index can never disagree with a Postgres query for the
// same key. Nulls sort last within a field (SQL's implicit order), ties fall
// through to the next entry, and the final id entry breaks them. Unknown keys
// fall back to newest.
function compareIndexProducts(a: CatalogueIndexProduct, b: CatalogueIndexProduct, sortParam: string): number {
  const entries = (SORT_OPTIONS[sortParam as SortKey] ??
    SORT_OPTIONS.newest) as readonly { [field: string]: "asc" | "desc" }[];
  for (const entry of entries) {
    const field = Object.keys(entry)[0];
    const dir = entry[field] === "desc" ? -1 : 1;
    const av = sortFieldValue(a, field);
    const bv = sortFieldValue(b, field);
    if (av === bv) continue;
    if (av == null) return 1;
    if (bv == null) return -1;
    const cmp =
      typeof av === "string" || typeof bv === "string"
        ? String(av).localeCompare(String(bv))
        : (av as number) - (bv as number);
    if (cmp !== 0) return cmp * dir;
  }
  return 0;
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
