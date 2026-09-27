"use client";

/**
 * The paged product grid — one module, two data sources.
 *
 * `/catalogue` and `/category/[slug]` are the same surface with a different
 * read behind them. Everything that *is* the grid lives here: the responsive
 * re-slice of the SSR payload, the skeleton / empty / error branches, the
 * reveal-until-images-settle overlay on a page change, and the one pagination
 * control. The pages keep only their own toolbar (search, category filter,
 * sort) and hero.
 *
 * The two copies this replaces had already diverged — the category page had
 * no settle overlay, a second pagination control with no windowing, and a
 * re-slice guard (`pageSize !== 12`) that could never fire because
 * `useResponsivePageSize` only returns 3 or 6.
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import ProductCard from "@/src/components/ui/ProductCard";
import { ProductCardSkeleton } from "@/src/components/ui/SkeletonLoader";
import GiftBoxModal from "@/src/components/pages/GiftBoxModal";
import ShippingNudgePopup from "@/src/components/ui/ShippingNudgePopup";
import { useShippingNudge } from "@/src/lib/hooks/useShippingNudge";
import { useAddToCart } from "@/src/lib/hooks/useAddToCart";
import type { CatalogueProduct } from "@/src/lib/api/schemas";

/** How long to wait for a page's images before letting the customer through. */
const IMAGE_SETTLE_TIMEOUT_MS = 12_000;
const SKELETON_COUNT = 6;
const ELLIPSIS_WINDOW = 7;

interface Props {
  products: CatalogueProduct[];
  total: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
  /** Set `currentPage` and scroll to top. */
  onPageChange: (page: number) => void;
  loading: boolean;
  /** A filter/search change swapped the query key; show skeletons, not stale rows. */
  filterLoading?: boolean;
  /** The new filter failed with no data to show. Omit if the page has no error branch. */
  filterError?: { message: string; onRetry: () => void } | null;
  /** Toolbar controls (search, sort, category filter) rendered above the grid. */
  toolbar?: ReactNode;
  /** Count line above the grid. Omit to hide it. */
  countLabel?: ReactNode;
  label: string;
  emptyMessage: string;
}

/** Page numbers to render, with `null` marking an ellipsis gap. */
function visiblePages(totalPages: number, currentPage: number): (number | null)[] {
  const pages: (number | null)[] = [];
  for (let n = 1; n <= totalPages; n++) {
    if (totalPages > ELLIPSIS_WINDOW && n !== 1 && n !== totalPages && Math.abs(n - currentPage) > 1) {
      if (pages[pages.length - 1] !== null) pages.push(null);
      continue;
    }
    pages.push(n);
  }
  return pages;
}

export default function ProductGrid({
  products,
  total,
  pageSize,
  currentPage,
  totalPages,
  onPageChange,
  loading,
  filterLoading = false,
  filterError = null,
  toolbar,
  countLabel,
  label,
  emptyMessage,
}: Props) {
  const {
    show: nudgeShow,
    newTotal: nudgeTotal,
    shippingLeft: nudgeLeft,
    trigger: triggerNudge,
    dismiss: dismissNudge,
  } = useShippingNudge();
  const { handleAdd, giftBox } = useAddToCart({ triggerShippingNudge: triggerNudge });

  // A page change holds the grid behind a spinner until every card's image has
  // settled, so a page never paints half-replaced. `timedOut` releases it if a
  // remote image hangs — the customer is never stuck on a permanent spinner.
  const [transitioning, setTransitioning] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const settledIds = useRef<Set<string>>(new Set());
  const targetPageReady = !loading;

  useEffect(() => {
    if (!transitioning) return;
    const timeoutId = window.setTimeout(() => {
      setTransitioning(false);
      setTimedOut(true);
    }, IMAGE_SETTLE_TIMEOUT_MS);
    return () => window.clearTimeout(timeoutId);
  }, [transitioning]);

  const handleSettled = useCallback(
    (productId: string) => {
      if (settledIds.current.has(productId)) return;
      settledIds.current.add(productId);
      if (targetPageReady && settledIds.current.size >= products.length) {
        setTransitioning(false);
      }
    },
    [products.length, targetPageReady],
  );

  // Cards whose image settled before the target page was ready never re-fire
  // their callback, so clear the overlay here if they already cover the page.
  useEffect(() => {
    if (transitioning && targetPageReady && settledIds.current.size >= products.length) {
      setTransitioning(false);
    }
  }, [transitioning, targetPageReady, products.length]);

  const handlePageChange = useCallback(
    (page: number) => {
      if (page === currentPage) return;
      setTimedOut(false);
      settledIds.current = new Set();
      setTransitioning(true);
      onPageChange(page);
    },
    [currentPage, onPageChange],
  );

  const showSkeletons = (loading && products.length === 0) || filterLoading;
  const from = Math.min((currentPage - 1) * pageSize + 1, total);
  const to = Math.min(currentPage * pageSize, total);

  return (
    <>
      <ShippingNudgePopup
        show={nudgeShow}
        newTotal={nudgeTotal}
        shippingLeft={nudgeLeft}
        dismiss={dismissNudge}
      />

      {toolbar}
      {countLabel}

      {filterError ? (
        <div className="catalogue-filter-error" role="status">
          <p>{filterError.message}</p>
          <button type="button" className="btn btn-secondary" onClick={filterError.onRetry}>
            Try again
          </button>
        </div>
      ) : showSkeletons ? (
        <div className="products-grid" role="list" aria-label={label} aria-busy="true">
          <p className="sr-only" role="status">
            Loading products…
          </p>
          {Array.from({ length: SKELETON_COUNT }, (_, i) => (
            <ProductCardSkeleton key={i} animationDelay={i * 0.06} />
          ))}
        </div>
      ) : (
        <>
          <div
            className={`catalogue-products-stage${transitioning ? " catalogue-products-stage--loading" : ""}`}
          >
            <div className="products-grid" role="list" aria-label={label}>
              {products.length === 0 ? (
                <p
                  style={{
                    textAlign: "center",
                    color: "var(--text-muted)",
                    gridColumn: "1 / -1",
                    padding: "60px 0",
                  }}
                >
                  {emptyMessage}
                </p>
              ) : (
                products.map((product, idx) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAdd={handleAdd}
                    transitionDelay={idx * 0.05}
                    priority={idx < SKELETON_COUNT}
                    loadImageImmediately={transitioning && targetPageReady}
                    onImageSettled={
                      transitioning && targetPageReady
                        ? () => handleSettled(product.id)
                        : undefined
                    }
                  />
                ))
              )}
            </div>
            {transitioning && (
              <div className="catalogue-page-loading" role="status" aria-live="polite">
                <span className="catalogue-page-spinner" aria-hidden="true" />
                <span>Preparing your next collection page…</span>
              </div>
            )}
          </div>

          {timedOut && (
            <p className="catalogue-page-loading-message" role="status">
              Some images are taking longer than expected. You can continue browsing while they finish
              loading.
            </p>
          )}

          {products.length > 0 && (
            <nav className="catalogue-pagination" aria-label={`${label} pagination`}>
              <div className="catalogue-pagination-info" aria-live="polite">
                <span className="catalogue-pagination-count">
                  Showing {from}–{to} of {total} products
                </span>
              </div>
              <div className="catalogue-pagination-controls">
                <button
                  className="catalogue-pagination-btn catalogue-pagination-prev"
                  disabled={currentPage <= 1 || transitioning}
                  onClick={() => handlePageChange(currentPage - 1)}
                  aria-label="Previous page"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                {visiblePages(totalPages, currentPage).map((pageNum, idx) =>
                  pageNum === null ? (
                    <span key={`gap-${idx}`} className="catalogue-pagination-ellipsis" aria-hidden="true">
                      …
                    </span>
                  ) : (
                    <button
                      key={pageNum}
                      className={`catalogue-pagination-btn ${pageNum === currentPage ? "catalogue-pagination-active" : ""}`}
                      onClick={() => handlePageChange(pageNum)}
                      disabled={transitioning}
                      aria-current={pageNum === currentPage ? "page" : undefined}
                      aria-label={`Page ${pageNum}`}
                    >
                      {pageNum}
                    </button>
                  ),
                )}
                <button
                  className="catalogue-pagination-btn catalogue-pagination-next"
                  disabled={currentPage >= totalPages || transitioning}
                  onClick={() => handlePageChange(currentPage + 1)}
                  aria-label="Next page"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </nav>
          )}
        </>
      )}
      {giftBox && <GiftBoxModal {...giftBox} />}
    </>
  );
}
