"use client";

import { useIsMobile } from "@/src/lib/hooks/useMediaQuery";

const DESKTOP_PAGE_SIZE = 6;
const MOBILE_PAGE_SIZE = 3;

/**
 * Returns a page size that adapts to the viewport width.
 * Returns `3` on mobile (≤768px) and `6` on desktop.
 * Defaults to MOBILE_PAGE_SIZE during SSR so the initial server render
 * matches mobile viewports — avoiding a costly CLS shift when 3 cards
 * are removed during client hydration.
 */
export function useResponsivePageSize(): number {
    // Mobile-first default, so the server render matches the mobile viewport.
    const isMobile = useIsMobile(true);
    return isMobile ? MOBILE_PAGE_SIZE : DESKTOP_PAGE_SIZE;
}