"use client";

import { useState, useCallback } from "react";
import { useCart } from "@/src/components/cart/CartProvider";
import { useToast } from "@/src/components/ui/ToastProvider";
import ProductCard from "@/src/components/ui/ProductCard";
import LoadingSpinner from "@/src/components/ui/LoadingSpinner";
import SectionHeader from "@/src/components/ui/SectionHeader";
import { useCatalogueProducts } from "@/src/lib/hooks/useAdminData";
import type { CatalogueProduct, ProductsResponse } from "@/src/lib/api/schemas";

const CATALOGUE_PAGE_SIZE = 6;

interface Props {
  initialProducts: CatalogueProduct[];
  initialTotal: number;
  initialTotalPages: number;
}

export default function CatalogueContent({ initialProducts, initialTotal, initialTotalPages }: Props) {
  const { addItem } = useCart();
  const { showToast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);

  const catalogueQuery = useCatalogueProducts(currentPage, {
    products: initialProducts as ProductsResponse["products"],
    total: initialTotal,
    page: currentPage,
    limit: CATALOGUE_PAGE_SIZE,
    totalPages: initialTotalPages,
  });

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
        image: p.imageUrl,
        stock: p.stockQuantity,
      });
      if (addResult === "max_reached") {
        showToast(`Maximum available quantity reached for ${p.name} (${p.stockQuantity})`, "info");
        return;
      }
      if (addResult === "out_of_stock") {
        showToast(`${p.name} is out of stock`, "error");
        return;
      }
      showToast(`${p.name} added to cart`, "success");
    },
    [addItem, showToast],
  );

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
          subtitle="Our Collection"
          title="Full Catalogue"
          description="Discover our complete selection of artisan-crafted luxury goods. Each item is carefully selected for its exceptional quality and timeless appeal."
        />

        {loading && products.length === 0 ? (
          <LoadingSpinner />
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
