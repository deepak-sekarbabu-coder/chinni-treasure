"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import ProductGrid from "@/src/components/pages/ProductGrid";
import SectionHeader from "@/src/components/ui/SectionHeader";
import { useCatalogueProducts } from "@/src/lib/hooks/useAdminData";
import { useResponsivePageSize } from "@/src/lib/hooks/useResponsivePageSize";
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
  initialSearch = "",
  initialCategories = [],
  initialCategoryId,
}: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(initialCategoryId);

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

  // The SSR payload is CATALOGUE_PAGE_SIZE wide; trim it to the responsive
  // page size so the first paint matches the page it claims to be.
  const initialData = useMemo<ProductsResponse>(
    () => ({
      products: (initialProducts as ProductsResponse["products"]).slice(0, pageSize),
      total: initialTotal,
      page: currentPage,
      limit: pageSize,
      totalPages: Math.max(1, Math.ceil(initialTotal / pageSize)),
    }),
    [pageSize, initialProducts, initialTotal, currentPage],
  );

  const catalogueQuery = useCatalogueProducts(
    currentPage,
    pageSize,
    searchQuery || undefined,
    initialData,
    selectedCategory,
  );

  const products: CatalogueProduct[] = catalogueQuery.data?.products ?? initialProducts;
  // Client-side so the fallback matches the responsive page size rather than
  // the server's fixed CATALOGUE_PAGE_SIZE.
  const totalPages = catalogueQuery.data?.totalPages ?? Math.max(1, Math.ceil(initialTotal / pageSize));
  const total = catalogueQuery.data?.total ?? initialTotal;
  const loading = catalogueQuery.isFetching;
  // Changing the category or committing a search swaps the query key to one
  // with no cached results, so React Query keeps exposing the previous set as
  // placeholder data while it fetches. That makes the grid never empty and the
  // initial skeleton branch never fire — the old category silently lingers
  // until the new products arrive. Show skeletons for that explicit "filter
  // change" load.
  const filterLoading = catalogueQuery.isPlaceholderData;
  // If that fetch ultimately fails there is no real data for the new key —
  // surface an error instead of leaving stale products (or an endless
  // skeleton) on screen. Only after retries finish: loading stays true while
  // React Query is retrying the failed request.
  const filterFailed = catalogueQuery.isError && catalogueQuery.isPlaceholderData && !loading;
  // Capture the retry fn before the filterFailed alias narrows the query result
  // union to an impossible combination inside the grid's error branch, which
  // would otherwise make this call a type error.
  const retryFilterFetch = useCallback(() => {
    void catalogueQuery.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogueQuery.refetch]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

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
        <SectionHeader
          subtitle=""
          title="Our Collection"
          description="Discover our complete selection of artisan-crafted luxury goods. Each item is carefully selected for its exceptional quality and timeless appeal."
        />

        <ProductGrid
          label="Product list"
          products={products}
          total={total}
          totalPages={totalPages}
          pageSize={pageSize}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          loading={loading}
          filterLoading={filterLoading}
          filterError={
            filterFailed
              ? { message: "We couldn’t load products for this selection. Please try again.", onRetry: retryFilterFetch }
              : null
          }
          emptyMessage="No products available yet."
          toolbar={
            <>
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
            </>
          }
        />
      </section>
    </div>
  );
}
