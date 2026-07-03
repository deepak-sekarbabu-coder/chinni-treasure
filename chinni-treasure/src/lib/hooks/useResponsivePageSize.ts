"use client";

import { useState, useEffect } from "react";

const DESKTOP_PAGE_SIZE = 6;
const MOBILE_PAGE_SIZE = 3;
const MOBILE_BREAKPOINT = "(max-width: 768px)";

/**
 * Returns a page size that adapts to the viewport width.
 * Returns `3` on mobile (≤768px) and `6` on desktop.
 * Uses `window.matchMedia` for SSR-safe, breakpoint-consistent detection.
 */
export function useResponsivePageSize(): number {
    const [pageSize, setPageSize] = useState(DESKTOP_PAGE_SIZE);

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
