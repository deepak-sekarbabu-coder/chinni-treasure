/**
 * Quality setting for product images. Next.js default is 75.
 * 85 provides a good balance between file size and visual fidelity
 * for product photography.
 */
export const PRODUCT_IMAGE_QUALITY = 85;

/**
 * Generic blur-up placeholder for remote/dynamic images.
 * A tiny cream-toned SVG matching the brand's light aesthetic.
 * Used with next/image `placeholder="blur"` + `blurDataURL` to prevent
 * white flash while product images load remotely.
 */
export const BLUR_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='100%25' height='100%25' fill='%23e8e0d4'/%3E%3C/svg%3E";
