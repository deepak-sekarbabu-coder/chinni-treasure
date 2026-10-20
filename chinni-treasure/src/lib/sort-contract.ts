/**
 * The ONE catalogue sort contract.
 *
 * A sort option is one concept — a key, an orderBy and a label — so all three
 * live in this entry and every surface that renders a sort picker, or documents
 * one, derives from it. This module is deliberately dependency-free (no Prisma,
 * no Redis, no "use client" work) so client components and the OpenAPI spec can
 * import it without dragging the server cache module into the browser bundle.
 *
 * `SORT_LABELS` is typed `Record<SortKey, string>`, so adding or removing a
 * key in SORT_OPTIONS without its label is a typecheck error, not a silent
 * drift: the key list, the label list and the documented enum cannot part
 * company.
 */

// Sort vocabulary — every entry is a complete orderBy: the chosen field first,
// then stockQuantity desc as a tiebreaker, then id desc. The /api/products DB
// branch (listProductsForQuery, in product-read), the category pages (product-read)
// and the in-memory catIndex comparator (catalogue-cache) all derive from these
// exact arrays, so changing the rule means editing this table.
export const SORT_OPTIONS = {
  newest: [{ createdAt: "desc" as const }, { stockQuantity: "desc" as const }, { id: "desc" as const }],
  oldest: [{ createdAt: "asc" as const }, { stockQuantity: "desc" as const }, { id: "desc" as const }],
  "name-asc": [{ name: "asc" as const }, { stockQuantity: "desc" as const }, { id: "desc" as const }],
  "name-desc": [{ name: "desc" as const }, { stockQuantity: "desc" as const }, { id: "desc" as const }],
  "price-asc": [{ price: "asc" as const }, { stockQuantity: "desc" as const }, { id: "desc" as const }],
  "price-desc": [{ price: "desc" as const }, { stockQuantity: "desc" as const }, { id: "desc" as const }],
  "stock-desc": [{ stockQuantity: "desc" as const }, { stockQuantity: "desc" as const }, { id: "desc" as const }],
  "stock-asc": [{ stockQuantity: "asc" as const }, { stockQuantity: "desc" as const }, { id: "desc" as const }],
  "sku-asc": [{ sku: "asc" as const }, { stockQuantity: "desc" as const }, { id: "desc" as const }],
  "sku-desc": [{ sku: "desc" as const }, { stockQuantity: "desc" as const }, { id: "desc" as const }],
} as const;

export type SortKey = keyof typeof SORT_OPTIONS;

export const SORT_KEYS = Object.keys(SORT_OPTIONS) as SortKey[];

/** Picker labels for every accepted key — exhaustive by type, not by review. */
export const SORT_LABELS: Record<SortKey, string> = {
  newest: "Newest First",
  oldest: "Oldest First",
  "name-asc": "Name A–Z",
  "name-desc": "Name Z–A",
  "price-asc": "Price: Low → High",
  "price-desc": "Price: High → Low",
  "stock-desc": "Stock: High → Low",
  "stock-asc": "Stock: Low → High",
  "sku-asc": "Code: A–Z",
  "sku-desc": "Code: Z–A",
};

/** The category page's allowed keys — a subset, not a re-declaration. */
export const CATEGORY_SORT_KEYS = [
  "newest",
  "price-asc",
  "price-desc",
] as const satisfies readonly SortKey[];

export type CategorySortKey = (typeof CATEGORY_SORT_KEYS)[number];

/** key → orderBy, the shape parseListQuery's sortMap wants. */
export const CATEGORY_SORT_MAP = Object.fromEntries(
  CATEGORY_SORT_KEYS.map((key) => [key, SORT_OPTIONS[key]]),
) as Record<CategorySortKey, (typeof SORT_OPTIONS)[SortKey]>;
