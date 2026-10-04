"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import ProductGrid from "@/src/components/pages/ProductGrid";
import { useCatalogueListing } from "@/src/components/pages/useCatalogueListing";
import SectionHeader from "@/src/components/ui/SectionHeader";
import { useCategoryProducts } from "@/src/lib/hooks/useAdminData";
import { useResponsivePageSize } from "@/src/lib/hooks/useResponsivePageSize";
import type { CatalogueProduct } from "@/src/lib/api/schemas";
import type { CategoryIdentity } from "@/src/lib/product-read";
import {
  CATEGORY_SORT_KEYS,
  SORT_LABELS,
  type CategorySortKey,
} from "@/src/lib/sort-contract";

interface Props {
  category: CategoryIdentity;
  initialProducts: CatalogueProduct[];
  initialTotal: number;
}

// The picker's keys, order and labels all come from the one catalogue sort
// contract; this component used to keep its own copy of all three.
type SortKey = CategorySortKey;

export default function CategoryContent({
  category,
  initialProducts,
  initialTotal,
}: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sort, setSort] = useState<SortKey>("newest");

  const pageSize = useResponsivePageSize();

  const categoryQuery = useCategoryProducts(
    category.slug,
    currentPage,
    pageSize,
    sort,
    { products: initialProducts, total: initialTotal, category },
  );

  const listing = useCatalogueListing({
    query: categoryQuery,
    initial: { products: initialProducts, total: initialTotal },
    setCurrentPage,
    pageSize,
  });

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
          products={listing.products}
          total={listing.total}
          totalPages={listing.totalPages}
          pageSize={listing.pageSize}
          currentPage={currentPage}
          onPageChange={listing.onPageChange}
          loading={listing.loading}
          filterLoading={listing.filterLoading}
          filterError={listing.filterError}
          emptyMessage="No products in this category yet."
          countLabel={
            <div className="catalogue-toolbar">
              <span className="catalogue-count" aria-live="polite">
                {listing.loading && listing.products.length === 0
                  ? "Loading…"
                  : `${initialTotal} product${initialTotal === 1 ? "" : "s"}`}
              </span>
              <label className="catalogue-sort">
                <span className="sr-only">Sort products</span>
                <select value={sort} onChange={handleSortChange} aria-label="Sort products">
                  {CATEGORY_SORT_KEYS.map((key) => (
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
