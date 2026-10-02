/**
 * One home for the public edge-cache TTLs.
 *
 * Every public read had two homes for one number: the owning cache module's
 * `ttlMs` and the route's hand-written `s-maxage` — so one edit desynced
 * origin from edge. Both now read the number here, and the `Cache-Control`
 * string is derived from it rather than restated.
 *
 * Dependency-free on purpose: the OpenAPI spec imports it without dragging
 * Prisma or Redis into `/api/docs`.
 */

/** Public read TTLs in ms. A public read with no entry here gets no entry. */
export const PUBLIC_TTL = {
  /** GET /api/products (active catalogue) — mirrors `productsCache`. */
  products: 30_000,
  /** GET /api/categories (public branch) — mirrors `categoriesCache`. */
  categories: 300_000,
  /** GET /api/categories/latest — mirrors `catLatestCache`. */
  latest: 60_000,
  /** GET /api/category/{slug}/products — mirrors `catPageCache`. */
  categoryPage: 60_000,
  /** GET /api/gift-boxes — mirrors `giftBoxCache`. */
  giftBoxes: 60_000,
  /** GET /api/orders/{id} — mirrors `orderDetailCache`. */
  orderDetail: 30_000,
  /** GET /api/track — mirrors `trackingCache`. */
  tracking: 15_000,
} as const;

/**
 * The public `Cache-Control` value for a TTL. `stale-while-revalidate` is
 * always twice the TTL — the app's one edge-freshness policy, so a new read
 * gets the same behaviour without restating a second number.
 * ponytail: the 2× ratio is the app's current value for every public read;
 * if the CDN ever wants a different window, change it here, not per route.
 */
export function publicCacheControl(ttlMs: number): string {
  const seconds = Math.max(1, Math.ceil(ttlMs / 1000));
  return `public, s-maxage=${seconds}, stale-while-revalidate=${seconds * 2}`;
}
