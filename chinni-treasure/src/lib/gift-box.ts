/**
 * The gift-box rule module — one vocabulary for "is this the Gift Box
 * category?", and the eligibility answer every surface reads.
 *
 * The identity used to be asserted two ways: `slug === "box"` on the server
 * (Order intake, the write guard, the gift-box list, the admin form) and
 * `name !== "Gift Boxes"` on the storefront (the detail button, add-to-cart).
 * The client never even received the slug — `ProductSchema` carried
 * `category: { name }` and nothing else — so the storefront had no choice but
 * to match on the display name, and a rename or an admin re-create (slug =
 * slugify(name) = `gift-boxes`) split the offer from the rules: the product page
 * offered gift boxes that placement then rejected.
 *
 * The slug is the identity; the name is a label. Ship the slug (both product
 * schemas and both product reads carry it now) and the second vocabulary is
 * gone.
 *
 * Dependency-free, so the client bundle imports the same answer the server
 * does.
 *
 * Placement rules stay with the [Order intake module] — this module only names
 * the identity they all read.
 */

/** The canonical slug of the Gift Box category (`prisma/seed-data.ts`). */
export const GIFT_BOX_CATEGORY_SLUG = "box";

/** The Prisma `where` fragment for "products in the Gift Box category". */
export const GIFT_BOX_CATEGORY_WHERE = { slug: GIFT_BOX_CATEGORY_SLUG } as const;

/** A product's category, as the client receives it. */
type CategoryRef = { slug?: string | null } | null | undefined;

/** The one predicate. Anything that isn't the Gift Box category is not one. */
export function isGiftBoxCategory(category: CategoryRef): boolean {
  return category?.slug === GIFT_BOX_CATEGORY_SLUG;
}

/**
 * Whether a customer may attach gift boxes to this product. A gift box cannot
 * be a bundle parent, and bundling has to be enabled on the product — the same
 * pair of checks the Order intake and the write guard make server-side, so the
 * storefront stops offering what checkout would reject.
 */
export function canBundleGiftBoxes(product: {
  allowGiftBoxBundling?: boolean | null;
  category?: CategoryRef;
}): boolean {
  return Boolean(product.allowGiftBoxBundling) && !isGiftBoxCategory(product.category);
}
