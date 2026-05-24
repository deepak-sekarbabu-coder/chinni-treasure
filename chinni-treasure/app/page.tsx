"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useCart } from "@/src/components/cart/CartProvider";
import { useToast } from "@/src/components/ui/ToastProvider";
import ProductCard from "@/src/components/ui/ProductCard";
import LoadingSpinner from "@/src/components/ui/LoadingSpinner";
import SectionHeader from "@/src/components/ui/SectionHeader";
import useScrollReveal from "@/src/lib/useScrollReveal";

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

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();
  const { showToast } = useToast();

  const { ref: productsRef, visible: productsVisible } = useScrollReveal();
  const { ref: featuresRef, visible: featuresVisible } = useScrollReveal();
  const { ref: ctaRef, visible: ctaVisible } = useScrollReveal();

  useEffect(() => {
    fetchProducts();
  }, []);

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
    <>
      {/* Hero Section */}
      <section className="hero" aria-labelledby="hero-heading">
        <div className="hero-pattern"></div>
        <div className="hero-content">
          <div className="hero-badge">Curated Collection</div>
          <h1 id="hero-heading">
            Where <span className="highlight">Craftsmanship</span>
            <br />
            Meets Elegance
          </h1>
          <p>
            Discover our handpicked selection of artisan-crafted luxury goods. Each piece tells a
            story of unparalleled quality and timeless design.
          </p>
          <div className="hero-actions">
            <Link href="/catalogue" className="btn btn-primary">
              Explore Collection
            </Link>
          </div>
        </div>
        <div className="hero-scroll" aria-hidden="true">
          <span>Scroll</span>
          <div className="scroll-line"></div>
        </div>
      </section>

      {/* Featured Products */}
      <section
        className="section"
        aria-labelledby="catalogue-heading"
        ref={productsRef as React.RefObject<HTMLElement>}
      >
        <div className={productsVisible ? "fade-in visible" : "fade-in"}>
          <SectionHeader
            subtitle="Our Collection"
            title="Featured Products"
            description="Each item is carefully selected for its exceptional quality and timeless appeal."
          />

          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="products-grid" role="list" aria-label="Product list">
              {products.map((product, idx) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdd={handleAdd}
                  transitionDelay={idx * 0.1}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section
        className="features"
        aria-labelledby="features-heading"
        ref={featuresRef as React.RefObject<HTMLElement>}
      >
        <div className={featuresVisible ? "fade-in visible" : "fade-in"}>
          <div className="features-grid" role="list">
            {[
              { icon: "✦", title: "Premium Quality", desc: "Every product is crafted from the finest materials with exceptional attention to detail." },
              { icon: "➤", title: "Free Shipping", desc: "Enjoy complimentary express shipping on all orders. Delivered within 3-5 business days." },
              { icon: "◈", title: "Secure Payment", desc: "Share your transaction ID after payment. Our team will verify and process your order promptly." },
              { icon: "♢", title: "Premium Support", desc: "Dedicated concierge service to assist you with every step of your purchase journey." },
            ].map((f, i) => (
              <div key={i} className="feature-item fade-in visible" role="listitem">
                <div className="feature-icon" aria-hidden="true">
                  {f.icon}
                </div>
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="section"
        style={{ textAlign: "center" }}
        aria-labelledby="cta-heading"
        ref={ctaRef as React.RefObject<HTMLElement>}
      >
        <div className={ctaVisible ? "fade-in visible" : "fade-in"}>
          <div className="section-subtitle">Get Started</div>
          <h2
            id="cta-heading"
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(1.5rem, 3vw, 2.5rem)",
              marginBottom: "16px",
            }}
          >
            Ready to Place Your Order?
          </h2>
          <p
            style={{
              color: "var(--text-muted)",
              maxWidth: "500px",
              margin: "0 auto 32px",
            }}
          >
            Select your items, add them to cart, and proceed to checkout. We&apos;ll take care of the
            rest.
          </p>
          <Link href="/catalogue" className="btn btn-dark">
            Start Your Order
          </Link>
        </div>
      </section>
    </>
  );
}
