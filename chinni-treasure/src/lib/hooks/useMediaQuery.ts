"use client";

import { useEffect, useState } from "react";

/** The one mobile breakpoint the app branches on. */
export const MOBILE_BREAKPOINT = "(max-width: 768px)";

/**
 * Subscribe to a media query. Two hooks each opened their own
 * `window.matchMedia` listener and each re-declared the 768px query, so the
 * page-size hook and the shipping nudge could disagree about "mobile"; this is
 * the one subscription both read.
 *
 * `defaultMatches` is the pre-measurement answer, so the server render and the
 * first client render agree. Default `false`; pass `true` for a mobile-first
 * surface that would otherwise shift after hydration.
 */
export function useMediaQuery(query: string, defaultMatches = false): boolean {
  const [matches, setMatches] = useState(defaultMatches);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const update = (event: MediaQueryListEvent | MediaQueryList) => setMatches(event.matches);
    update(mql);
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [query]);

  return matches;
}

/** `true` on mobile viewports (≤768px). `defaultMatches` is the SSR answer. */
export function useIsMobile(defaultMatches = false): boolean {
  return useMediaQuery(MOBILE_BREAKPOINT, defaultMatches);
}