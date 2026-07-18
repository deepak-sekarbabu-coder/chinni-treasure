"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ProductData } from "@/src/components/ui/ProductCard";

const PLACEHOLDER_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23e8e0d4' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-family='sans-serif' font-size='14'%3EImage unavailable%3C/text%3E%3C/svg%3E";

interface Props {
  initialProducts?: ProductData[];
}

function SkeletonCard() {
  return (
    <div className="recently-added-skeleton-card">
      <div className="recently-added-skeleton-image" />
      <div className="recently-added-skeleton-body">
        <div className="recently-added-skeleton-line w-40" />
        <div className="recently-added-skeleton-line w-70" />
        <div className="recently-added-skeleton-line w-50" />
      </div>
    </div>
  );
}

export default function RecentlyAddedProducts({ initialProducts }: Props) {
  const [products, setProducts] = useState<ProductData[]>(initialProducts ?? []);
  const [loading, setLoading] = useState(!initialProducts);
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  useEffect(() => {
    if (initialProducts) return;
    const controller = new AbortController();
    fetch("/api/products/recent?limit=12", {
      signal: controller.signal,
      cache: "no-cache",
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [initialProducts]);

  const updateScrollState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollPrev(el.scrollLeft > 4);
    setCanScrollNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState, loading]);

  const scroll = useCallback((direction: "prev" | "next") => {
    const el = trackRef.current;
    if (!el) return;
    const cardWidth = (el.firstElementChild as HTMLElement)?.offsetWidth ?? 260;
    const scrollAmount = (cardWidth + 20) * 2;
    el.scrollBy({ left: direction === "next" ? scrollAmount : -scrollAmount, behavior: "smooth" });
  }, []);

  if (!loading && products.length === 0) return null;

  return (
    <section className="recently-added" aria-labelledby="recently-added-heading">
      <div className="section-header">
        <p id="recently-added-heading" className="section-subtitle">
          Fresh Arrivals
        </p>
        <h2>Recently Added To Our Collection</h2>
        <p>Be the first to discover our latest handcrafted pieces.</p>
      </div>

      <div className="recently-added-carousel">
        {loading ? (
          <div className="recently-added-skeleton">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <>
            <div
              className="recently-added-track"
              ref={trackRef}
              role="list"
              aria-label="Recently added products"
            >
              {products.map((product, i) => {
                const imgFailed = false;
                const primaryImage =
                  product.images?.find((img) => img.isPrimary)?.url ||
                  product.imageUrl ||
                  PLACEHOLDER_SVG;

                return (
                  <div
                    key={product.id}
                    className="recently-added-slide"
                    role="listitem"
                  >
                    <Link
                      href={`/catalogue/${product.id}`}
                      className="recently-added-card"
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <div className="recently-added-card-image">
                        <Image
                          src={imgFailed ? PLACEHOLDER_SVG : primaryImage}
                          alt={product.name}
                          fill
                          sizes="(max-width: 480px) 200px, (max-width: 768px) 220px, (max-width: 1024px) 280px, 25vw"
                          loading={i < 4 ? "eager" : "lazy"}
                          priority={i < 4}
                        />
                        <span className="recently-added-new-badge">New</span>
                        {product.badge && (
                          <span className="recently-added-product-badge">
                            {product.badge}
                          </span>
                        )}
                      </div>
                      <div className="recently-added-card-body">
                        <div className="recently-added-card-category">
                          {product.category?.name || "General"}
                        </div>
                        <h3 className="recently-added-card-title">
                          {product.name}
                        </h3>
                        <div className="recently-added-card-footer">
                          <span className="recently-added-card-price">
                            {product.compareAtPrice &&
                            Number(product.compareAtPrice) > Number(product.price) ? (
                              <>
                                <span className="recently-added-card-price-original">
                                  ₹{Number(product.compareAtPrice).toFixed(2)}
                                </span>
                                ₹{Number(product.price).toFixed(2)}
                              </>
                            ) : (
                              <>₹{Number(product.price).toFixed(2)}</>
                            )}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>

            <div className="recently-added-nav" aria-hidden="true">
              <button
                className="recently-added-nav-btn prev"
                onClick={() => scroll("prev")}
                tabIndex={-1}
                aria-label="Previous products"
                disabled={!canScrollPrev}
                style={{ opacity: canScrollPrev ? 1 : 0.3 }}
              >
                <svg viewBox="0 0 24 24">
                  <polyline points="15,18 9,12 15,6" />
                </svg>
              </button>
              <button
                className="recently-added-nav-btn next"
                onClick={() => scroll("next")}
                tabIndex={-1}
                aria-label="Next products"
                disabled={!canScrollNext}
                style={{ opacity: canScrollNext ? 1 : 0.3 }}
              >
                <svg viewBox="0 0 24 24">
                  <polyline points="9,6 15,12 9,18" />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>

      <div className="recently-added-cta">
        <Link href="/catalogue" className="btn btn-secondary btn-sm">
          View All New Arrivals
        </Link>
      </div>
    </section>
  );
}
