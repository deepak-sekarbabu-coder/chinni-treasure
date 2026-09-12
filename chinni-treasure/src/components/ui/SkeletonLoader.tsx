"use client";

import React from "react";

interface SkeletonBaseProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  style?: React.CSSProperties;
}

function SkeletonText({ className, width, height, style }: SkeletonBaseProps) {
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

function SkeletonBlock({ className, width, height, borderRadius, style }: SkeletonBaseProps) {
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