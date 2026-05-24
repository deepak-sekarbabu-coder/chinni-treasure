"use client";

import { useState, useEffect, useCallback } from "react";
import { useCart } from "@/src/components/cart/CartProvider";
import { useToast } from "@/src/components/ui/ToastProvider";
import ProductCard from "@/src/components/ui/ProductCard";
import LoadingSpinner from "@/src/components/ui/LoadingSpinner";
import SectionHeader from "@/src/components/ui/SectionHeader";

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  description: string;
  category: { name: string } | null;
  stockQuantity: number;
  badge: string | null;
}

export default function CataloguePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();
  const { showToast } = useToast();

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/products");
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const handleAdd = useCallback(
    (p: Product) => {
      if (p.stockQuantity <= 0) {
        showToast(`${p.name} is out of stock`, "error");
        return;
      }
      addItem({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        image: p.imageUrl,
        stock: p.stockQuantity,
      });
      showToast(`${p.name} added to cart`, "success");
    },
    [addItem, showToast],
  );

  return (
    <div style={{ paddingTop: "72px" }}>
      <section className="section" aria-labelledby="catalogue-heading">
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
