"use client";

import { useState, useEffect, useCallback } from "react";
import { useCart } from "@/src/components/cart/CartProvider";
import { useToast } from "@/src/components/ui/ToastProvider";
import ProductCard from "@/src/components/ui/ProductCard";
import LoadingSpinner from "@/src/components/ui/LoadingSpinner";
import SectionHeader from "@/src/components/ui/SectionHeader";

export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  description: string;
  category: { name: string } | null;
  stockQuantity: number;
  badge: string | null;
}

interface Props {
  initialProducts: Product[];
}

export default function CatalogueContent({ initialProducts }: Props) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(initialProducts.length === 0);
  const { addItem } = useCart();
  const { showToast } = useToast();

  useEffect(() => {
    if (initialProducts.length > 0) return;
    async function fetchProducts() {
      try {
        const res = await fetch("/api/products?limit=200");
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products ?? data);
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [initialProducts.length]);

  const handleAdd = useCallback(
    (p: Product) => {
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

        {loading ? (
          <LoadingSpinner />
        ) : (
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
                />
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
}
