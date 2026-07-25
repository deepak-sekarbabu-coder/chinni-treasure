"use client";

import { useState, useCallback, useMemo } from "react";
import { useCart } from "@/src/components/cart/CartProvider";
import { useToast } from "@/src/components/ui/ToastProvider";
import ShippingNudgePopup from "@/src/components/ui/ShippingNudgePopup";
import ProductCard from "@/src/components/ui/ProductCard";
import SectionHeader from "@/src/components/ui/SectionHeader";
import { ProductCardSkeleton } from "@/src/components/ui/SkeletonLoader";
import { useCatalogueProducts } from "@/src/lib/hooks/useAdminData";
import { useShippingNudge } from "@/src/lib/hooks/useShippingNudge";
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
  initialTotalPages,
  initialSearch = "",
  initialCategories = [],
  initialCategoryId,
}: Props) {
  const { addItem } = useCart();
  const { showToast } = useToast();
  const {
    show: shippingNudgeShow,
    newTotal: shippingNudgeTotal,
    shippingLeft: shippingNudgeLeft,
    trigger: triggerShippingNudge,
    dismiss: dismissShippingNudge,
  } = useShippingNudge();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(initialCategoryId);

  const pageSize = useResponsivePageSize();

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
  const totalPages = catalogueQuery.data?.totalPages ?? initialTotalPages;
  const loading = catalogueQuery.isFetching;

  const handleAdd = useCallback(
    (p: CatalogueProduct) => {
      if (p.stockQuantity <= 0) {
        showToast(`${p.name} is out of stock`, "error");
        return;
      }
      const addResult = addItem({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        image: p.imageUrl ?? "",
        stock: p.stockQuantity,
      });
      if (addResult === "max_one") {
        showToast(`Max 1 Qty per user for ${p.name}`, "info");
        return;
      }
      if (addResult === "max_reached") {
        showToast(`Maximum available quantity reached for ${p.name} (${p.stockQuantity})`, "info");
        return;
      }
      if (addResult === "out_of_stock") {
        showToast(`${p.name} is out of stock`, "error");
        return;
      }
      triggerShippingNudge(Number(p.price), 1);
      showToast(`${p.name} added to cart`, "success");
    },
    [addItem, showToast, triggerShippingNudge],
  );

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
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
            value={searchQuery}
            onChange={handleSearch}
            aria-label="Search products by code"
            readOnly={loading}
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

        {loading && products.length === 0 ? (
          <div className="products-grid" role="list" aria-label="Product list">
            {Array.from({ length: 3 }).map((_, i) => (
              <ProductCardSkeleton key={i} animationDelay={i * 0.06} />
            ))}
          </div>
        ) : (
          <>
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
                  />
                ))
              )}
            </div>

            {products.length > 0 && (
              <nav className="pagination-bar catalogue-pagination" aria-label="Catalogue pagination">
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={currentPage <= 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  aria-label="Previous page"
                >
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    className={`btn btn-sm ${pageNum === currentPage ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => handlePageChange(pageNum)}
                    aria-current={pageNum === currentPage ? "page" : undefined}
                    aria-label={`Page ${pageNum}`}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  aria-label="Next page"
                >
                  Next →
                </button>
              </nav>
            )}
          </>
        )}
      </section>
    </div>
  );
}
