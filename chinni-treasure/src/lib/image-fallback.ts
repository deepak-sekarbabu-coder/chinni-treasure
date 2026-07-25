// ------------------------------------------------------------------
// Image Optimization Fallback Utilities
// ------------------------------------------------------------------
//
// Provides a mechanism to gracefully degrade away from Next.js image
// optimization when Vercel's free-tier quota (or any CDN limit) is
// exhausted.  Two complementary strategies:
//
//  1.  NEXT_PUBLIC_IMAGE_UNOPTIMIZED – hard kill-switch.  When the env
//      var is truthy at build time, FallbackImage skips next/image
//      entirely and renders a plain <img>.
//
//  2.  Per-URL failure tracking – if an individual image fails to load
//      through next/image (e.g. 402 / 503 from the optimizer), the
//      component remembers the URL in localStorage and loads it via a
//      plain <img> on subsequent visits.
// ------------------------------------------------------------------

const STORAGE_KEY = "ct:image-failed-urls";
const FAIL_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ---- public helpers ------------------------------------------------

/**
 * True when the hard kill-switch env var is set to a truthy value.
 * Checked at module scope so it can be used in conditionals without
 * calling a function every render.
 */
export const OPTIMIZATION_DISABLED =
  typeof process !== "undefined" &&
  process.env.NEXT_PUBLIC_IMAGE_UNOPTIMIZED === "true";

/** Record a URL as having failed through the image optimizer. */
export function markImageFailed(src: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const map: Record<string, number> = raw ? JSON.parse(raw) : {};
    map[src] = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // localStorage unavailable – silently ignore
  }
}

/**
 * Returns true when the given src has previously failed through the
 * optimizer and the failure is still within the TTL window.
 */
export function hasImageFailed(src: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const map: Record<string, number> = JSON.parse(raw);
    const ts = map[src];
    if (!ts) return false;
    if (Date.now() - ts > FAIL_TTL_MS) {
      // Expired – clean up
      delete map[src];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
