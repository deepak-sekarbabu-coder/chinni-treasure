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

export function CategoryCardSkeleton({ animationDelay = 0 }: { animationDelay?: number }) {
  return (
    <div
      className="latest-category-skeleton-block"
      style={{ animationDelay: `${animationDelay}s` }}
    >
      <div className="latest-category-skeleton-image" />
      <div className="latest-category-skeleton-line w-60" />
      <div className="latest-category-skeleton-line w-40" />
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="product-detail-layout">
      <div className="product-detail-gallery">
        <SkeletonBlock width="100%" height={500} borderRadius="8px" style={{ marginBottom: "20px" }} />
        <div style={{ display: "flex", gap: "12px" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock key={i} width={80} height={80} borderRadius="6px" />
          ))}
        </div>
      </div>
      <div className="product-detail-info">
        <SkeletonText width={240} height={32} style={{ marginBottom: "16px" }} />
        <SkeletonText width={120} height={24} style={{ marginBottom: "24px" }} />
        <SkeletonText width={300} height={16} style={{ marginBottom: "32px" }} />
        <div style={{ display: "flex", gap: "16px", marginBottom: "32px" }}>
          <SkeletonBlock width={120} height={48} borderRadius="6px" />
          <SkeletonBlock width={140} height={48} borderRadius="6px" />
        </div>
        <div style={{ borderTop: "1px solid var(--cream)", paddingTop: "24px" }}>
          <SkeletonText width={180} height={16} style={{ marginBottom: "16px" }} />
          <SkeletonText width={300} height={14} style={{ marginBottom: "8px" }} />
          <SkeletonText width={250} height={14} style={{ marginBottom: "8px" }} />
          <SkeletonText width={200} height={14} />
        </div>
      </div>
    </div>
  );
}

export function CheckoutSkeleton() {
  return (
    <div className="order-layout">
      <div>
        <div className="order-fieldset">
          <SkeletonText width={160} height={20} style={{ marginBottom: "24px" }} />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="form-group" style={{ marginBottom: "16px" }}>
              <SkeletonText width={80} height={12} style={{ marginBottom: "8px" }} />
              <SkeletonBlock width="100%" height="44px" borderRadius="2px" />
            </div>
          ))}
        </div>
      </div>
      <div className="order-summary-sidebar">
        <div className="admin-stat-card">
          <SkeletonText width={140} height={18} style={{ marginBottom: "24px" }} />
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="skeleton-row" style={{ gap: "12px", marginBottom: "16px" }}>
              <SkeletonBlock width={50} height={60} borderRadius="4px" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <SkeletonText width={120} height={14} style={{ marginBottom: "8px" }} />
                <SkeletonText width={60} height={12} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SearchResultsSkeleton({ itemCount = 6 }: { itemCount?: number }) {
  return (
    <div className="search-results-container">
      <div className="search-header">
        <SkeletonText width={200} height={32} style={{ marginBottom: "12px" }} />
        <SkeletonText width={300} height={16} />
      </div>
      <div className="search-filters">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} width={120} height={40} borderRadius="6px" style={{ marginRight: "12px", marginBottom: "12px" }} />
        ))}
      </div>
      <div className="products-grid" role="list" aria-label="Search results">
        {Array.from({ length: itemCount }).map((_, i) => (
          <ProductCardSkeleton key={i} animationDelay={i * 0.05} />
        ))}
      </div>
      <div className="search-pagination">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonBlock key={i} width={40} height={40} borderRadius="4px" style={{ margin: "0 4px" }} />
        ))}
      </div>
    </div>
  );
}