"use client";

import { useCallback } from "react";
import Link from "next/link";
import { useCart } from "@/src/components/cart/CartProvider";
import { useToast } from "@/src/components/ui/ToastProvider";
import useScrollReveal from "@/src/lib/useScrollReveal";

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

export default function HomeContent() {
  const { addItem } = useCart();
  const { showToast } = useToast();

  const { ref: featuresRef, visible: featuresVisible } = useScrollReveal();

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
    <>
      {/* Hero Section */}
      <section className="hero" aria-labelledby="hero-heading">
        <div className="hero-pattern"></div>
        <div className="hero-content">
          <h1 id="hero-heading">
            Own the Art of
            <br />
            <span className="highlight">Timeless Luxury</span>
            <br />
            for Everyday Elegance
          </h1>
          <p>
            Discover museum-worthy pieces handcrafted by skilled artisans. Premium materials,
            graceful design, and a buying experience made to feel as exceptional as the products.
          </p>
          <div className="hero-trust" aria-label="brand highlights">
            <span>Handcrafted Originals</span>
            <span>Limited Batch Drops</span>
            <span>Concierge Support</span>
          </div>
          <div className="hero-actions">
            <Link href="/catalogue" className="btn btn-primary">
              Explore Collection
            </Link>
            <Link href="/track" className="btn btn-secondary">
              Track Your Order
            </Link>
          </div>
        </div>
        <div className="hero-story" aria-hidden="true">
          <div className="hero-story-card">
            <div className="hero-story-label">Signature Edit</div>
            <h3>Designed to Be Gifted and Kept Forever</h3>
            <p>
              Every piece in our signature selection is curated for heirloom quality, modern
              styling, and meaningful moments.
            </p>
            <div className="hero-story-stats">
              <div>
                <strong>4.9/5</strong>
                <span>Customer Delight</span>
              </div>
              <div>
                <strong>3-5 Days</strong>
                <span>Express Delivery</span>
              </div>
              <div>
                <strong>100%</strong>
                <span>Craft Verified</span>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-scroll" aria-hidden="true">
          <span>Scroll</span>
          <div className="scroll-line"></div>
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

    </>
  );
}
