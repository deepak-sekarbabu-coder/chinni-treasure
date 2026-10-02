"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import ProductGrid from "@/src/components/pages/ProductGrid";
import { ssrPageSlice, useCatalogueListing } from "@/src/components/pages/useCatalogueListing";
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
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(initialCategoryId);
  const [page, setPage] = useState(1);

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
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  const pageSize = useResponsivePageSize();

  // The SSR payload is CATALOGUE_PAGE_SIZE wide; trim it to the responsive
  // page size so the first paint matches the page it claims to be.
  const initialData = useMemo<ProductsResponse>(
    () => ({
      products: ssrPageSlice(initialProducts as ProductsResponse["products"], pageSize),
      total: initialTotal,
      page,
      limit: pageSize,
      totalPages: Math.max(1, Math.ceil(initialTotal / pageSize)),
    }),
    [pageSize, initialProducts, initialTotal, page],
  );

  const catalogueQuery = useCatalogueProducts(
    page,
    pageSize,
    searchQuery || undefined,
    initialData,
    selectedCategory,
  );

  const listing = useCatalogueListing({
    query: catalogueQuery,
    initial: { products: initialProducts, total: initialTotal },
    setCurrentPage: setPage,
  });

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  }, []);

  const handleCategoryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedCategory(value ? Number.parseInt(value, 10) : undefined);
    setPage(1);
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
          products={listing.products}
          total={listing.total}
          totalPages={listing.totalPages}
          pageSize={listing.pageSize}
          currentPage={page}
          onPageChange={listing.onPageChange}
          loading={listing.loading}
          filterLoading={listing.filterLoading}
          filterError={listing.filterError}
          emptyMessage="No products available yet."
          toolbar={
            <>
              <div className="catalogue-search">
                <input
                  type="text"
                  className={`catalogue-search-input${listing.loading ? " catalogue-search-input--loading" : ""}`}
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
