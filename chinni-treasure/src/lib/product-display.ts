/**
 * One home for the product display transforms: stock health, primary-image
 * pick, and price/discount view. Every customer and admin surface renders
 * from these so thresholds and math can't drift between views (the low-stock
 * cutoff was ≤3 on cards vs ≤5 on the detail page).
 */
import { IMAGE_UNAVAILABLE_PLACEHOLDER } from "./images";

/** One low-stock threshold for every surface. */
export const LOW_STOCK_MAX = 3;

export type StockState = "out" | "low" | "in";

export function stockHealth(qty: number): StockState {
  if (qty <= 0) return "out";
  if (qty <= LOW_STOCK_MAX) return "low";
  return "in";
}

interface DisplayInput {
  price: number;
  compareAtPrice?: number | null;
  stockQuantity: number;
  imageUrl: string | null;
  badge?: string | null;
  images?: { url: string; isPrimary: boolean }[] | null;
}

/** Primary gallery image, else the single image, else the shared placeholder. */
export function primaryImage(p: Pick<DisplayInput, "imageUrl" | "images">): string {
  return p.images?.find((img) => img.isPrimary)?.url || p.imageUrl || IMAGE_UNAVAILABLE_PLACEHOLDER;
}

/**
 * The full ordered image list for a product, as URLs — primary first (via the
 * one picker's rule), then the rest of the gallery, then the single fallback.
 * The Gallery & Lightbox module's callers hand this to the viewer instead of
 * re-deriving the list, so a viewer never re-picks which images exist
 * (the admin catalogue lightbox used to re-derive `images ?? imageUrl` here).
 * Empty when there is nothing to show — the viewer renders its empty state.
 */
export function imageUrls(p: Pick<DisplayInput, "imageUrl" | "images">): string[] {
  const urls = (p.images ?? []).map((img) => img.url).filter(Boolean);
  if (urls.length > 0) return urls;
  return p.imageUrl ? [p.imageUrl] : [];
}

/**
 * Whether a stored image URL is worth handing to `next/image`. This one
 * verdict is read by every surface that renders a product/order image: the
 * admin form gate, the catalogue table thumb, and the order card thumb. They
 * used to each re-answer it — two as a `/^https?:\/\//` regex, the form as a
 * `new URL` parse — so a URL one accepted and another rejected rendered
 * differently depending on which screen you were on.
 *
 * Load *failures* are a different question and `FallbackImage` owns them.
 */
export function isDisplayableImageUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  try {
    const protocol = new URL(url).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

export interface ProductDisplayView {
  /** src for the card/detail image, never empty. */
  image: string;
  price: number;
  /** MRP, present only when a real discount exists (compare > price). */
  compareAtPrice: number | null;
  hasDiscount: boolean;
  /** Rounded percent off, 0 when no discount. */
  discountPercent: number;
  stock: StockState;
  badge: string | null;
  /** Admin badge chip class, e.g. "badge-bestseller". */
  badgeClass: string;
}

export function productDisplayView(p: DisplayInput): ProductDisplayView {
  const price = Number(p.price) || 0;
  const compare = Number(p.compareAtPrice) || 0;
  const hasDiscount = compare > price;
  return {
    image: primaryImage(p),
    price,
    compareAtPrice: hasDiscount ? compare : null,
    hasDiscount,
    discountPercent: hasDiscount ? Math.round(((compare - price) / compare) * 100) : 0,
    stock: stockHealth(p.stockQuantity),
    badge: p.badge ?? null,
    badgeClass: p.badge ? `badge-${p.badge.toLowerCase()}` : "",
  };
}
