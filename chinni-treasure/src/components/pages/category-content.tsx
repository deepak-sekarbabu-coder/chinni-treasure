"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useCart } from "@/src/components/cart/CartProvider";
import { useToast } from "@/src/components/ui/ToastProvider";
import ShippingNudgePopup from "@/src/components/ui/ShippingNudgePopup";
import ProductCard, { type ProductData } from "@/src/components/ui/ProductCard";
import SectionHeader from "@/src/components/ui/SectionHeader";
import { ProductCardSkeleton } from "@/src/components/ui/SkeletonLoader";
import { useCategoryProducts } from "@/src/lib/hooks/useAdminData";
import { useShippingNudge } from "@/src/lib/hooks/useShippingNudge";
import { useResponsivePageSize } from "@/src/lib/hooks/useResponsivePageSize";
import type { CategoryProductsResponse, Product } from "@/src/lib/api/schemas";

interface CategoryInfo {
  id: number;
  name: string;
  slug: string;
  description: string | null;
}

interface Props {
  category: CategoryInfo;
  initialProducts: Product[];
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
  const [sort, setSort] = useState<SortKey>("newest");

  const pageSize = useResponsivePageSize();

  const initialData = useMemo(() => {
    const sliced =
      pageSize !== 12
        ? initialProducts.slice(0, pageSize)
        : initialProducts;
    return {
      category,
      products: sliced,
      total: initialTotal,
      page: currentPage,
      limit: pageSize,
      totalPages: Math.max(1, Math.ceil(initialTotal / pageSize)),
    } as CategoryProductsResponse;
  }, [pageSize, initialProducts, initialTotal, currentPage, category]);

  const categoryQuery = useCategoryProducts(
    category.slug,
    currentPage,
    pageSize,
    sort,
    initialData,
  );

  const products: Product[] = categoryQuery.data?.products ?? initialProducts;
  const totalPages = categoryQuery.data?.totalPages ?? initialTotalPages;
  const loading = categoryQuery.isFetching;

  const handleAdd = useCallback(
    (p: ProductData) => {
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
        showToast(
          `Maximum available quantity reached for ${p.name} (${p.stockQuantity})`,
          "info",
        );
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

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [],
  );

  const handleSortChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSort(e.target.value as SortKey);
      setCurrentPage(1);
    },
    [],
  );

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
        <ShippingNudgePopup
          show={shippingNudgeShow}
          newTotal={shippingNudgeTotal}
          shippingLeft={shippingNudgeLeft}
          dismiss={dismissShippingNudge}
        />
        <SectionHeader
          subtitle=""
          title={`${category.name} Products`}
          description={`Discover our latest ${category.name.toLowerCase()} — handcrafted and curated for you.`}
        />

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

        {loading && products.length === 0 ? (
          <div className="products-grid" role="list" aria-label={`${category.name} products`}>
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} animationDelay={i * 0.06} />
            ))}
          </div>
        ) : (
          <>
            <div className="products-grid" role="list" aria-label={`${category.name} products`}>
              {products.length === 0 ? (
                <p
                  style={{
                    textAlign: "center",
                    color: "var(--text-muted)",
                    gridColumn: "1 / -1",
                    padding: "60px 0",
                  }}
                >
                  No products in this category yet.
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

            {products.length > 0 && totalPages > 1 && (
              <nav
                className="pagination-bar catalogue-pagination"
                aria-label="Category pagination"
              >
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
                    className={`btn btn-sm ${
                      pageNum === currentPage ? "btn-primary" : "btn-secondary"
                    }`}
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
