"use client";

import { useState, useEffect, useCallback } from "react";
import { useCart } from "@/src/components/cart/CartProvider";
import { useToast } from "@/src/components/ui/ToastProvider";

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
        <div className="section-header fade-in visible">
          <div className="section-subtitle">Our Collection</div>
          <h2 id="catalogue-heading">Full Catalogue</h2>
          <p>
            Discover our complete selection of artisan-crafted luxury goods. Each item is carefully
            selected for its exceptional quality and timeless appeal.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div className="loading-spinner" style={{ margin: "0 auto" }}></div>
          </div>
        ) : (
          <div className="products-grid" role="list" aria-label="Product list">
            {products.length === 0 ? (
              <p style={{ textAlign: "center", color: "var(--text-muted)", gridColumn: "1 / -1", padding: "60px 0" }}>
                No products available yet.
              </p>
            ) : (
              products.map((product, idx) => (
                <div
                  key={product.id}
                  className="product-card fade-in visible"
                  style={{ transitionDelay: `${idx * 0.05}s` }}
                  role="listitem"
                >
                  <div className="product-card-image">
                    <img src={product.imageUrl || "/placeholder.svg"} alt={product.name} />
                    {product.badge && <span className="product-card-badge">{product.badge}</span>}
                  </div>
                  <div className="product-card-body">
                    <div className="product-card-category">{product.category?.name || "General"}</div>
                    <h3>{product.name}</h3>
                    <p className="product-card-description">{product.description}</p>
                    <div className="product-card-footer">
                      <span className="product-card-price">₹{Number(product.price).toFixed(2)}</span>
                      {product.stockQuantity <= 0 ? (
                        <span className="stock-badge empty">Out of Stock</span>
                      ) : product.stockQuantity <= 3 ? (
                        <span className="stock-badge low">Only {product.stockQuantity} left</span>
                      ) : (
                        <span className="stock-badge in-stock">In Stock</span>
                      )}
                      <button
                        className="btn-add"
                        disabled={product.stockQuantity <= 0}
                        onClick={() => handleAdd(product)}
                      >
                        {product.stockQuantity <= 0 ? "Sold Out" : "Add to Cart"}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
}
