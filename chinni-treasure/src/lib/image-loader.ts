// fallow-ignore-file unused-file
import type { ImageLoaderProps } from "next/image";

/**
 * Custom Next.js image loader that passes remote images through without
 * server-side optimisation.
 *
 * Why this exists:
 * Next.js's built-in image optimiser has a ~30 s internal timeout when
 * fetching remote images.  The product catalogue uses images hosted on
 * i.imgur.gg, which is frequently slow or unreachable.  When the optimiser
 * times out the entire page render fails with a 500.
 *
 * By skipping server-side optimisation we let the browser handle the image
 * loading directly.  If the remote host is slow the browser will show the
 * component's `onError` fallback (the cream placeholder SVG) instead of
 * crashing the page.
 *
 * Trade-off: images are no longer resized or converted to WebP on the
 * server.  The browser will request the original format.  This is
 * acceptable because:
 *  1. All images are already served as JPEGs at moderate quality.
 *  2. The `sizes` attribute on each <Image> still tells the browser the
 *     appropriate display width so it doesn't download oversized assets.
 *  3. The reliability gain far outweighs the minor increase in transfer
 *     size.
 */
export default function imageLoader({ src, width, quality }: ImageLoaderProps): string {
  const q = quality ?? 75;

  // For local / absolute-path images, append width/quality as query params
  // so the loader satisfies Next.js's width-implementation check.
  if (src.startsWith("/") || src.startsWith("data:")) {
    if (src.startsWith("data:")) return src;
    const localUrl = new URL(src, "http://localhost");
    localUrl.searchParams.set("w", String(width));
    localUrl.searchParams.set("q", String(q));
    return localUrl.pathname + localUrl.search;
  }

  // Append width and quality as query params so the browser (and any CDN
  // in front of the origin) can still make use of them for responsive
  // sizing, even though the server doesn't transform the image.
  const url = new URL(src);
  url.searchParams.set("w", String(width));
  url.searchParams.set("q", String(q));
  return url.toString();
}
