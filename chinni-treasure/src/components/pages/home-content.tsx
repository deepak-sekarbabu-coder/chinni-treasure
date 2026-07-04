"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";

export default function HomeContent() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const q = searchQuery.trim();
      if (q) {
        router.push(`/catalogue?search=${encodeURIComponent(q)}`);
      } else {
        router.push("/catalogue");
      }
    },
    [searchQuery, router],
  );

  return (
    <>
      {/* Hero Section */}
      <section className="hero" aria-labelledby="hero-heading">
        <div className="hero-pattern"></div>
        <div className="hero-content">
          <h1 id="hero-heading">
            &ldquo;Own The Art Of
            <br />
            <span className="highlight">Timeless Luxury</span>
            <br />
            For Everyday Elegance.&rdquo;
          </h1>
          <p> Artisan-made 🪄 Premium materials 💎 Unrivaled design ✍️ </p>
          <p> Discover handcrafted items that make a statement, paired with a seamless shopping experience you&apos;ll fall in love. </p>
          <div className="hero-trust" aria-label="brand highlights">
            <span>⭐Handcrafted Originals⭐</span>
            <span>⏳Limited Batch Drops⏳</span>
            <span>🎁Concierge Support🎁</span>
          </div>

          <form className="hero-search" onSubmit={handleSearch}>
            <div className="hero-search-container">
              <div className="search-icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </div>
              <input
                type="text"
                className="hero-search-input"
                placeholder="Search by product code..."
                aria-label="Search products"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="hero-search-button" type="submit" aria-label="Search">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12,5 19,12 12,19" />
                </svg>
              </button>
            </div>
          </form>

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
              Designed for today, crafted to last generations. Every piece in our signature collection is chosen to elevate your everyday moments.
            </p>
            <div className="hero-story-stats">
              <div>
                <strong>4.9/5</strong>
                <span>Customer Delight</span>
              </div>
              <div>
                <strong>5 -7</strong>
                <span>(Business Days)</span>
                <span>Delivery Time</span>

              </div>
              <div>
                <strong>100%</strong>
                <span>Enjoy free shipping on all orders above ₹599</span>
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
      >
        <div className="section-header">
          <p id="features-heading" className="section-subtitle">Why Choose Us</p>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.8rem, 3vw, 2.8rem)", color: "var(--near-black)", marginBottom: "16px", fontWeight: 400 }}>
            Crafted With Passion, Delivered With Care
          </h2>
        </div>
        <div className="features-grid" role="list">
          {[
            { icon: "\u2726", title: "Premium Quality", desc: "Every product is crafted from the finest materials with exceptional attention to detail." },
            { icon: "\u27a4", title: "Free Shipping", desc: "Enjoy complimentary express shipping on all orders above ₹599. Delivered within 5-7 business days." },
            { icon: "\u25c8", title: "Secure Payment", desc: "Share your transaction ID after payment. Our team will verify and process your order promptly." },
            { icon: "\u2662", title: "Premium Support", desc: "Dedicated concierge service to assist you with every step of your purchase journey." },
          ].map((f, i) => (
            <div key={i} className="feature-item" role="listitem">
              <div className="feature-icon" aria-hidden="true">
                {f.icon}
              </div>
              <h4>{f.title}</h4>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

    </>
  );
}
