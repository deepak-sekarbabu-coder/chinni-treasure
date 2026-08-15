"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import FallbackImage from "@/src/components/ui/FallbackImage";
import Link from "next/link";
import { PRODUCT_IMAGE_QUALITY, BLUR_PLACEHOLDER } from "@/src/lib/images";
import { fetchLatestCategories } from "@/src/lib/api";
import type { LatestCategoriesResponse, LatestCategorySection } from "@/src/lib/api/schemas";

const PLACEHOLDER_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23e8e0d4' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-family='sans-serif' font-size='14'%3EImage unavailable%3C/text%3E%3C/svg%3E";

interface Props {
  initialSections?: LatestCategoriesResponse;
}

function CategoryCard({ section, index }: { section: LatestCategorySection; index: number }) {
  const { category, product } = section;
  const [imgFailed, setImgFailed] = useState(false);
  const primaryImage =
    product.images?.find((img) => img.isPrimary)?.url ||
    product.imageUrl ||
    PLACEHOLDER_SVG;
  const hasDiscount =
    product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price);

  return (
    <article className="latest-category-block" aria-labelledby={`latest-cat-${category.slug}`}>
      <div className="latest-category-head">
        <Link
          href={`/category/${category.slug}`}
          className="latest-category-name-link"
          aria-label={`Browse ${category.name} products`}
        >
          <h3 id={`latest-cat-${category.slug}`} className="latest-category-name">
            {category.name}
          </h3>
        </Link>
        <Link
          href={`/category/${category.slug}`}
          className="latest-category-viewall"
          aria-label={`Shop Category — all ${category.name} products`}
        >
          Shop Category
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12,5 19,12 12,19" />
          </svg>
        </Link>
      </div>

      {/* No aria-label: the accessible name comes from the card content
          (product name + price), so it matches the visible text exactly. */}
      <Link
        href={`/catalogue/${product.id}`}
        className="latest-category-card"
        style={{ textDecoration: "none", color: "inherit" }}
      >
        <div className="latest-category-card-image">
          <FallbackImage
            src={imgFailed ? PLACEHOLDER_SVG : primaryImage}
            alt={product.name}
            fill
            sizes="(max-width: 480px) 80vw, (max-width: 768px) 45vw, (max-width: 1200px) 22vw, 18vw"
            quality={PRODUCT_IMAGE_QUALITY}
            placeholder="blur"
            blurDataURL={BLUR_PLACEHOLDER}
            loading={index < 4 ? "eager" : "lazy"}
            priority={index < 2}
            onError={() => setImgFailed(true)}
          />
          {product.badge && (
            <span className="latest-category-badge">{product.badge}</span>
          )}
        </div>
        <div className="latest-category-card-body">
          <h4 className="latest-category-card-title">{product.name}</h4>
          <div className="latest-category-card-footer">
            <span className="latest-category-card-price">
              {hasDiscount ? (
                <>
                  <span className="latest-category-card-price-original">
                    ₹{Number(product.compareAtPrice).toFixed(2)}
                  </span>
                  ₹{Number(product.price).toFixed(2)}
                </>
              ) : (
                <>₹{Number(product.price).toFixed(2)}</>
              )}
            </span>
            {hasDiscount && (
              <span className="latest-category-card-discount">
                {Math.round(
                  (1 - Number(product.price) / Number(product.compareAtPrice)) * 100,
                )}
                % OFF
              </span>
            )}
          </div>
        </div>
      </Link>
      <Link
        href={`/category/${category.slug}`}
        className="latest-category-shop-link"
        aria-label={`Shop ${category.name} products`}
      >
        Shop {category.name}
      </Link>
    </article>
  );
}

export default function LatestInEveryCategory({ initialSections }: Props) {
  const [sections, setSections] = useState<LatestCategoriesResponse>(
    initialSections ?? [],
  );
  const [loading, setLoading] = useState(!initialSections);
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    if (initialSections) return;
    const controller = new AbortController();
    fetchLatestCategories(controller.signal)
      .then(setSections)
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [initialSections]);

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
  }, [updateScrollState, loading, sections.length]);

  const scroll = useCallback((direction: "prev" | "next") => {
    const el = trackRef.current;
    if (!el) return;
    const cardWidth = (el.firstElementChild as HTMLElement)?.offsetWidth ?? 280;
    const scrollAmount = (cardWidth + 24) * 2;
    el.scrollBy({
      left: direction === "next" ? scrollAmount : -scrollAmount,
      behavior: "smooth",
    });
  }, []);

  if (!loading && sections.length === 0) return null;

  return (
    <section className="latest-every-category" aria-labelledby="latest-every-category-heading">
      <div className="section-header">
        <p id="latest-every-category-heading" className="section-subtitle">
          Curated By Category
        </p>
        <h2>Latest in Every Category</h2>
        <p>Discover the newest treasure from each of our collections.</p>
        <Link href="/catalogue" className="latest-category-viewall-link">
          View All Categories
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12,5 19,12 12,19" />
          </svg>
        </Link>
      </div>

      {loading ? (
        <div className="latest-category-skeleton">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="latest-category-skeleton-block">
              <div className="latest-category-skeleton-image" />
              <div className="latest-category-skeleton-line w-60" />
              <div className="latest-category-skeleton-line w-40" />
            </div>
          ))}
        </div>
      ) : (
        <div className="latest-category-carousel">
          <div
            className="latest-category-track"
            ref={trackRef}
            role="list"
            aria-label="Latest products in each category"
          >
            {sections.map((section, i) => (
              <div className="latest-category-slide" role="listitem" key={section.category.slug}>
                <CategoryCard section={section} index={i} />
              </div>
            ))}
          </div>

          <div className="latest-category-nav" aria-hidden="true">
            <button
              className="latest-category-nav-btn prev"
              onClick={() => scroll("prev")}
              tabIndex={-1}
              aria-label="Previous categories"
              disabled={!canScrollPrev}
              style={{ opacity: canScrollPrev ? 1 : 0.3 }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <polyline points="15,18 9,12 15,6" />
              </svg>
            </button>
            <button
              className="latest-category-nav-btn next"
              onClick={() => scroll("next")}
              tabIndex={-1}
              aria-label="Next categories"
              disabled={!canScrollNext}
              style={{ opacity: canScrollNext ? 1 : 0.3 }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <polyline points="9,6 15,12 9,18" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
