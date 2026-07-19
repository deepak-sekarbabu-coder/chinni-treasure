"use client";

import { useState, useEffect } from "react";

const DESKTOP_PAGE_SIZE = 6;
const MOBILE_PAGE_SIZE = 3;
const MOBILE_BREAKPOINT = "(max-width: 768px)";

/**
 * Returns a page size that adapts to the viewport width.
 * Returns `3` on mobile (≤768px) and `6` on desktop.
 * Defaults to MOBILE_PAGE_SIZE during SSR so the initial server render
 * matches mobile viewports — avoiding a costly CLS shift when 3 cards
 * are removed during client hydration.
 */
export function useResponsivePageSize(): number {
    const [pageSize, setPageSize] = useState(MOBILE_PAGE_SIZE);

    useEffect(() => {
        const mql = window.matchMedia(MOBILE_BREAKPOINT);

        const update = (e: MediaQueryListEvent | MediaQueryList) => {
            setPageSize(e.matches ? MOBILE_PAGE_SIZE : DESKTOP_PAGE_SIZE);
        };

        // Set initial value
        update(mql);

        // Listen for changes
        mql.addEventListener("change", update);
        return () => mql.removeEventListener("change", update);
    }, []);

    return pageSize;
}
