"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import ProductGrid from "@/src/components/pages/ProductGrid";
import SectionHeader from "@/src/components/ui/SectionHeader";
import { useCategoryProducts } from "@/src/lib/hooks/useAdminData";
import { useResponsivePageSize } from "@/src/lib/hooks/useResponsivePageSize";
import type { CatalogueProduct, CategoryProductsResponse } from "@/src/lib/api/schemas";

interface CategoryInfo {
  id: number;
  name: string;
  slug: string;
  description: string | null;
}

interface Props {
  category: CategoryInfo;
  initialProducts: CatalogueProduct[];
  initialTotal: number;
  initialTotalPages: number;
}

type SortKey = "newest" | "price-asc" | "price-desc";

const SORT_LABELS: Record<SortKey, string> = {
  newest: "Newest first",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
};

export default function CategoryContent({
  category,
  initialProducts,
  initialTotal,
  initialTotalPages,
}: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sort, setSort] = useState<SortKey>("newest");

  const pageSize = useResponsivePageSize();

  // The SSR payload is wider than the responsive page size; trim it so the
  // first paint matches the page it claims to be.
  const initialData = useMemo<CategoryProductsResponse>(
    () =>
      ({
        category,
        products: (initialProducts as CategoryProductsResponse["products"]).slice(0, pageSize),
        total: initialTotal,
        page: currentPage,
        limit: pageSize,
        totalPages: Math.max(1, Math.ceil(initialTotal / pageSize)),
      }) as CategoryProductsResponse,
    [pageSize, initialProducts, initialTotal, currentPage, category],
  );

  const categoryQuery = useCategoryProducts(
    category.slug,
    currentPage,
    pageSize,
    sort,
    initialData,
  );

  const products = categoryQuery.data?.products ?? initialProducts;
  const totalPages = categoryQuery.data?.totalPages ?? initialTotalPages;
  const total = categoryQuery.data?.total ?? initialTotal;
  const loading = categoryQuery.isFetching;

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleSortChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSort(e.target.value as SortKey);
    setCurrentPage(1);
  }, []);

  return (
    <div style={{ paddingTop: "72px" }}>
      <section className="catalogue-hero category-hero" aria-labelledby="category-heading">
        <div className="catalogue-hero-inner">
          <p className="catalogue-kicker">Collection</p>
          <h1 id="category-heading">{category.name}</h1>
          {category.description && (
            <p dangerouslySetInnerHTML={{ __html: category.description }} />
          )}
          <div className="category-hero-actions">
            <Link href="/catalogue" className="btn btn-secondary btn-sm">
              View Full Collection
            </Link>
          </div>
        </div>
      </section>

      <section className="section catalogue-section" aria-labelledby="category-products-heading">
        <SectionHeader
          subtitle=""
          title={`${category.name} Products`}
          description={`Discover our latest ${category.name.toLowerCase()} — handcrafted and curated for you.`}
        />

        <ProductGrid
          label={`${category.name} products`}
          products={products}
          total={total}
          totalPages={totalPages}
          pageSize={pageSize}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          loading={loading}
          emptyMessage="No products in this category yet."
          countLabel={
            <div className="catalogue-toolbar">
              <span className="catalogue-count" aria-live="polite">
                {loading && products.length === 0
                  ? "Loading…"
                  : `${initialTotal} product${initialTotal === 1 ? "" : "s"}`}
              </span>
              <label className="catalogue-sort">
                <span className="sr-only">Sort products</span>
                <select value={sort} onChange={handleSortChange} aria-label="Sort products">
                  {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                    <option key={key} value={key}>
                      {SORT_LABELS[key]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          }
        />
      </section>
    </div>
  );
}
