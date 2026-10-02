"use client";

import React from "react";

interface SkeletonBaseProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  style?: React.CSSProperties;
}

export function SkeletonText({ className, width, height, style }: SkeletonBaseProps) {
  return (
    <div
      className={`skeleton-text ${className || ""}`}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        borderRadius: "3px",
        ...style
      }}
    />
  );
}

export function SkeletonBlock({ className, width, height, borderRadius, style }: SkeletonBaseProps) {
  return (
    <div
      className={`skeleton-block ${className || ""}`}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        borderRadius: borderRadius || "4px",
        ...style
      }}
    />
  );
}

export function ProductCardSkeleton({ animationDelay = 0 }: { animationDelay?: number }) {
  return (
    <div
      className="product-card chart-skeleton"
      style={{ animationDelay: `${animationDelay}s` }}
    >
      <div className="product-card-image">
        <SkeletonBlock width="100%" height="100%" />
      </div>
      <div className="product-card-body">
        <SkeletonText className="skeleton-text-name" width={140} height={12} style={{ marginBottom: "8px" }} />
        <SkeletonText width={180} height={14} style={{ marginBottom: "12px" }} />
        <SkeletonText className="skeleton-text-price" width={60} height={14} />
      </div>
    </div>
  );
}

/**
 * The catalogue grid skeleton — hero, section header, and a grid of
 * ProductCardSkeleton. Shared by the catalogue and category route loading
 * files, which were 43-line twins; each route keeps only its own wrapper.
 * This module owns HOW a listing loads; the routes own where.
 */
export function CatalogueGridSkeleton({ cardCount = 6 }: { cardCount?: number }) {
  return (
    <>
      <section className="catalogue-hero">
        <div className="catalogue-hero-inner">
          {/* min(_, vw) caps come from the catalogue twin, so neither route
              overflows a narrow viewport; identical to fixed sizes on desktop. */}
          <SkeletonText width="min(120px, 40vw)" height="12px" style={{ marginBottom: "14px" }} />
          <SkeletonText width="min(320px, 85vw)" height="36px" style={{ marginBottom: "16px" }} />
          <SkeletonText width="min(400px, 90vw)" height="14px" />
        </div>
      </section>
      <section className="catalogue-section">
        <div className="section">
          <div className="section-header">
            <SkeletonText width="140px" height="12px" style={{ margin: "0 auto 12px" }} />
            <SkeletonText width="min(280px, 75vw)" height="28px" style={{ margin: "0 auto 16px" }} />
          </div>
          <div className="products-grid">
            {Array.from({ length: cardCount }).map((_, i) => (
              <ProductCardSkeleton key={i} animationDelay={i * 0.06} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}