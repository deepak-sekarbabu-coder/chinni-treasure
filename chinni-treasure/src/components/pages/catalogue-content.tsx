"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import ShippingNudgePopup from "@/src/components/ui/ShippingNudgePopup";
import GiftBoxModal, { type GiftBoxModalProduct } from "@/src/components/pages/GiftBoxModal";
import ProductCard from "@/src/components/ui/ProductCard";
import SectionHeader from "@/src/components/ui/SectionHeader";
import { ProductCardSkeleton } from "@/src/components/ui/SkeletonLoader";
import { useCatalogueProducts } from "@/src/lib/hooks/useAdminData";
import { useShippingNudge } from "@/src/lib/hooks/useShippingNudge";
import { useResponsivePageSize } from "@/src/lib/hooks/useResponsivePageSize";
import { useAddToCart } from "@/src/lib/hooks/useAddToCart";
import type { CatalogueProduct, ProductsResponse } from "@/src/lib/api/schemas";

interface CategoryOption {
  id: number;
  name: string;
  slug: string;
}

interface Props {
  initialProducts: CatalogueProduct[];
  initialTotal: number;
  initialTotalPages: number;
  initialSearch?: string;
  initialCategories?: CategoryOption[];
  initialCategoryId?: number;
}

export default function CatalogueContent({
  initialProducts,
  initialTotal,
  initialTotalPages,
  initialSearch = "",
  initialCategories = [],
  initialCategoryId,
}: Props) {
  const {
    show: shippingNudgeShow,
    newTotal: shippingNudgeTotal,
    shippingLeft: shippingNudgeLeft,
    trigger: triggerShippingNudge,
    dismiss: dismissShippingNudge,
  } = useShippingNudge();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(initialCategoryId);
  const [pageTransitionLoading, setPageTransitionLoading] = useState(false);
  const [pageTransitionTimedOut, setPageTransitionTimedOut] = useState(false);
  const settledImageIdsRef = useRef<Set<string>>(new Set());
  const [giftBoxModalOpen, setGiftBoxModalOpen] = useState(false);
  const [giftBoxModalProduct, setGiftBoxModalProduct] = useState<GiftBoxModalProduct | null>(null);

  const pageSize = useResponsivePageSize();

  // Debounce search commits so typing fires one request per pause, not per
  // keystroke; the input itself stays responsive and never blocks on loading.
  // The initial value comes from SSR, so skip committing it on mount.
  const isInitialSearch = useRef(true);
  useEffect(() => {
    if (isInitialSearch.current) {
      isInitialSearch.current = false;
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setSearchQuery(searchInput);
      setCurrentPage(1);
    }, 300);
    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  // Transform SSR data to match the current page size (avoids flash on mobile)
  const initialData = useMemo(() => {
    const slicedProducts =
      pageSize !== 6
        ? (initialProducts as ProductsResponse["products"]).slice(0, pageSize)
        : (initialProducts as ProductsResponse["products"]);
    return {
      products: slicedProducts,
      total: initialTotal,
      page: currentPage,
      limit: pageSize,
      totalPages: Math.max(1, Math.ceil(initialTotal / pageSize)),
    };
  }, [pageSize, initialProducts, initialTotal, currentPage]);

  const catalogueQuery = useCatalogueProducts(currentPage, pageSize, searchQuery || undefined, initialData, selectedCategory);

  const products: CatalogueProduct[] = catalogueQuery.data?.products ?? initialProducts;
  // Use client-side calculation so the fallback matches the responsive page
  // size instead of the server's fixed CATALOGUE_PAGE_SIZE.
  const totalPages = catalogueQuery.data?.totalPages ?? Math.max(1, Math.ceil(initialTotal / pageSize));
  const total = catalogueQuery.data?.total ?? initialTotal;
  const loading = catalogueQuery.isFetching;
  const targetPageReady = catalogueQuery.data?.page === currentPage;
  // Changing the category or committing a search swaps the query key to one
  // with no cached results, so React Query keeps exposing the previous set as
  // placeholder data while it fetches. That makes the grid never empty and the
  // initial skeleton branch never fire — the old category silently lingers
  // until the new products arrive. Show skeletons for that explicit "filter
  // change" load. Pagination is excluded: it drives its own reveal-until-
  // images-settle overlay via pageTransitionLoading below.
  const filterLoading = catalogueQuery.isPlaceholderData && !pageTransitionLoading;
  // If that fetch ultimately fails there is no real data for the new key —
  // surface an error instead of leaving stale products (or an endless
  // skeleton) on screen. Only after retries finish: loading stays true while
  // React Query is retrying the failed request.
  const queryHasError = catalogueQuery.isError;
  const queryShowingPlaceholder = catalogueQuery.isPlaceholderData;
  const filterFailed = queryHasError && queryShowingPlaceholder && !loading;
  // Capture the retry fn before the filterFailed alias below narrows the
  // query result union to an impossible combination (never) inside the JSX
  // branch, which would otherwise make this call a type error.
  const retryFilterFetch = () => {
    void catalogueQuery.refetch();
  };

  // Never leave the customer looking at a permanent spinner if a remote image
  // hangs. The individual card's error handler settles failed images normally.
  useEffect(() => {
    if (!pageTransitionLoading) return;
    const timeoutId = window.setTimeout(() => {
      setPageTransitionLoading(false);
      setPageTransitionTimedOut(true);
    }, 12000);
    return () => window.clearTimeout(timeoutId);
  }, [pageTransitionLoading]);

  const handleImageSettled = useCallback(
    (productId: string) => {
      const settled = settledImageIdsRef.current;
      if (settled.has(productId)) return;
      settled.add(productId);
      if (targetPageReady && settled.size >= products.length) {
        setPageTransitionLoading(false);
      }
    },
    [products.length, targetPageReady],
  );

  // When the target page data arrives, some images may have already settled
  // before targetPageReady became true — their onImageSettled callbacks won't
  // re-fire. Clear the loading overlay immediately if everything is ready.
  useEffect(() => {
    if (pageTransitionLoading && targetPageReady && settledImageIdsRef.current.size >= products.length) {
      setPageTransitionLoading(false);
    }
  }, [pageTransitionLoading, targetPageReady, products.length]);

  const { handleAddDirectly, handleAdd, handleModalConfirm } = useAddToCart<CatalogueProduct>({
    triggerShippingNudge,
    onOpenGiftBoxModal: (p) => {
      setGiftBoxModalProduct({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        image: p.imageUrl ?? "",
        category: p.category,
      });
      setGiftBoxModalOpen(true);
    },
  });

  const handleModalConfirmWithClose = useCallback(
    (giftBoxes: Array<{ productId: string; name: string; price: number; image: string; quantity: number }>) => {
      handleModalConfirm(giftBoxModalProduct, giftBoxes);
      setGiftBoxModalOpen(false);
      setGiftBoxModalProduct(null);
    },
    [giftBoxModalProduct, handleModalConfirm],
  );

  const handleModalSkip = useCallback(() => {
    if (giftBoxModalProduct) {
      handleAddDirectly(
        { ...giftBoxModalProduct, imageUrl: giftBoxModalProduct.image, stockQuantity: 1, description: null, badge: null, sku: null, category: null } as CatalogueProduct,
      );
    }
    setGiftBoxModalOpen(false);
    setGiftBoxModalProduct(null);
  }, [giftBoxModalProduct, handleAddDirectly]);

  const handleModalClose = useCallback(() => {
    setGiftBoxModalOpen(false);
    setGiftBoxModalProduct(null);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    if (page === currentPage) return;
    setPageTransitionTimedOut(false);
    settledImageIdsRef.current = new Set();
    setPageTransitionLoading(true);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  }, []);

  const handleCategoryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedCategory(value ? Number.parseInt(value, 10) : undefined);
    setCurrentPage(1);
  }, []);

  return (
    <div style={{ paddingTop: "72px" }}>
      <section className="catalogue-hero">
        <div className="catalogue-hero-inner">
          <p className="catalogue-kicker">Luxury Marketplace</p>
          <h1>Curated for Taste. Crafted for Legacy.</h1>
          <p>
            Explore our complete collection of artisan-crafted pieces designed to elevate everyday
            spaces and meaningful gifting.
          </p>
        </div>
      </section>
      <section className="section catalogue-section" aria-labelledby="catalogue-heading">
        <ShippingNudgePopup
          show={shippingNudgeShow}
          newTotal={shippingNudgeTotal}
          shippingLeft={shippingNudgeLeft}
          dismiss={dismissShippingNudge}
        />
        <SectionHeader
          subtitle=""
          title="Our Collection"
          description="Discover our complete selection of artisan-crafted luxury goods. Each item is carefully selected for its exceptional quality and timeless appeal."
        />

        <div className="catalogue-search">
          <input
            type="text"
            className={`catalogue-search-input${loading ? " catalogue-search-input--loading" : ""}`}
            placeholder="Search by product code..."
            value={searchInput}
            onChange={handleSearch}
            aria-label="Search products by code"
          />
        </div>

        <div className="catalogue-filter">
          <label htmlFor="catalogue-category-filter" className="catalogue-filter-label">
            Filter by category
          </label>
          <select
            id="catalogue-category-filter"
            className="catalogue-filter-select"
            value={selectedCategory ? String(selectedCategory) : ""}
            onChange={handleCategoryChange}
            aria-label="Filter products by category"
          >
            <option value="">All Categories</option>
            {initialCategories.map((cat) => (
              <option key={cat.id} value={String(cat.id)}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {filterFailed ? (
          <div className="catalogue-filter-error" role="status">
            <p>We couldn’t load products for this selection. Please try again.</p>
            <button type="button" className="btn btn-secondary" onClick={retryFilterFetch}>
              Try again
            </button>
          </div>
        ) : (loading && products.length === 0) || filterLoading ? (
          <div className="products-grid" role="list" aria-label="Product list" aria-busy="true">
            <p className="sr-only" role="status">
              Loading products…
            </p>
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeleton key={i} animationDelay={i * 0.06} />
            ))}
          </div>
        ) : (
          <>
            <div className={`catalogue-products-stage${pageTransitionLoading ? " catalogue-products-stage--loading" : ""}`}>
              <div className="products-grid" role="list" aria-label="Product list">
              {products.length === 0 ? (
                <p style={{ textAlign: "center", color: "var(--text-muted)", gridColumn: "1 / -1", padding: "60px 0" }}>
                  No products available yet.
                </p>
              ) : (
                products.map((product, idx) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAdd={handleAdd}
                    transitionDelay={idx * 0.05}
                    priority={idx < 6}
                    loadImageImmediately={pageTransitionLoading && targetPageReady}
                    onImageSettled={pageTransitionLoading && targetPageReady ? () => handleImageSettled(product.id) : undefined}
                  />
                ))
              )}
              </div>
              {pageTransitionLoading && (
                <div className="catalogue-page-loading" role="status" aria-live="polite">
                  <span className="catalogue-page-spinner" aria-hidden="true" />
                  <span>Preparing your next collection page…</span>
                </div>
              )}
            </div>

            {pageTransitionTimedOut && (
              <p className="catalogue-page-loading-message" role="status">
                Some images are taking longer than expected. You can continue browsing while they finish loading.
              </p>
            )}

            {products.length > 0 && (
              <nav className="catalogue-pagination" aria-label="Catalogue pagination">
                <div className="catalogue-pagination-info" aria-live="polite">
                  <span className="catalogue-pagination-count">
                    Showing {Math.min((currentPage - 1) * pageSize + 1, total)}–{Math.min(currentPage * pageSize, total)} of {total} products
                  </span>
                </div>
                <div className="catalogue-pagination-controls">
                  <button
                    className="catalogue-pagination-btn catalogue-pagination-prev"
                    disabled={currentPage <= 1 || pageTransitionLoading}
                    onClick={() => handlePageChange(currentPage - 1)}
                    aria-label="Previous page"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((pageNum) => {
                      if (totalPages <= 7) return true;
                      if (pageNum === 1 || pageNum === totalPages) return true;
                      if (Math.abs(pageNum - currentPage) <= 1) return true;
                      return false;
                    })
                    .reduce<(number | string)[]>((acc, pageNum, idx, arr) => {
                      if (idx > 0) {
                        const prev = arr[idx - 1] as number;
                        if (pageNum - prev > 1) acc.push("…");
                      }
                      acc.push(pageNum);
                      return acc;
                    }, [])
                    .map((item, idx) =>
                      typeof item === "string" ? (
                        <span key={`ellipsis-${idx}`} className="catalogue-pagination-ellipsis" aria-hidden="true">
                          …
                        </span>
                      ) : (
                        <button
                          key={item}
                          className={`catalogue-pagination-btn ${item === currentPage ? "catalogue-pagination-active" : ""}`}
                          onClick={() => handlePageChange(item)}
                          disabled={pageTransitionLoading}
                          aria-current={item === currentPage ? "page" : undefined}
                          aria-label={`Page ${item}`}
                        >
                          {item}
                        </button>
                      )
                    )}
                  <button
                    className="catalogue-pagination-btn catalogue-pagination-next"
                    disabled={currentPage >= totalPages || pageTransitionLoading}
                    onClick={() => handlePageChange(currentPage + 1)}
                    aria-label="Next page"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                </div>
              </nav>
            )}
          </>
        )}
      </section>
      {giftBoxModalProduct && (
        <GiftBoxModal
          open={giftBoxModalOpen}
          product={giftBoxModalProduct}
          onConfirm={handleModalConfirmWithClose}
          onSkip={handleModalSkip}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
