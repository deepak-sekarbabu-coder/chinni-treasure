/**
 * Quality setting for product images.
 *
 * 75 is the Next.js default and the value Lighthouse recommends for product
 * photography. The previous 85 setting produced images ~30% larger than
 * necessary with no perceptible visual difference at typical display sizes
 * (catalogue cards render at ~542px wide). Dropping to 75 reclaims a large
 * portion of the ~504 KiB of estimated savings flagged by Lighthouse.
 */
export const PRODUCT_IMAGE_QUALITY = 75;

/**
 * Generic blur-up placeholder for remote/dynamic images.
 * A tiny cream-toned SVG matching the brand's light aesthetic.
 * Used with next/image `placeholder="blur"` + `blurDataURL` to prevent
 * white flash while product images load remotely.
 */
export const BLUR_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='100%25' height='100%25' fill='%23e8e0d4'/%3E%3C/svg%3E";
