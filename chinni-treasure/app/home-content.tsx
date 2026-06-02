"use client";

import Link from "next/link";
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
  const { ref: featuresRef, visible: featuresVisible } = useScrollReveal();

  return (
    <>
      {/* Hero Section */}
      <section className="hero" aria-labelledby="hero-heading">
        <div className="hero-pattern"></div>
        <div className="hero-content">
          <h1 id="hero-heading">
            "Own The Art Of
            <br />
            <span className="highlight">Timeless Luxury</span>
            <br />
            For Everyday Elegance."
          </h1>
          <p>
            Artisan-made. Premium materials. Unrivaled design. Discover handcrafted items that make a statement, paired with a seamless shopping experience you’ll love.
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
            <div className="hero-story-label"><h2>Signature Edit</h2></div>
            <h3>Designed To Be Gifted And Kept Forever</h3>
            <p>
              Designed for today, crafted to last generations. Every piece in our signature collection is chosen to elevate your everyday moments
            </p>
            <div className="hero-story-stats">
              <div>
                <strong>4.9/5</strong>
                <span>Customer Delight</span>
              </div>
              <div>
                <strong>5 -10 Days</strong>
                <span>Delivery</span>
              </div>
              <div>
                <strong>100%</strong>
                <span>Free Shipping on all Orders</span>
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
              { icon: "➤", title: "Free Shipping", desc: "Enjoy complimentary express shipping on all orders. Delivered within 5-10 business days." },
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
