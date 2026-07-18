"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import StockBadge from "./StockBadge";
import {
  PRODUCT_IMAGE_QUALITY,
  BLUR_PLACEHOLDER,
} from "@/src/lib/images";

const PLACEHOLDER_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23e8e0d4' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-family='sans-serif' font-size='14'%3EImage unavailable%3C/text%3E%3C/svg%3E";

export interface ProductImageData {
  id: string;
  url: string;
  isPrimary: boolean;
  displayOrder: number;
}

export interface ProductData {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number | null;
  imageUrl: string | null;
  description: string | null;
  category: { name: string } | null;
  stockQuantity: number;
  badge: string | null;
  images?: ProductImageData[];
}

interface Props {
  product: ProductData;
  onAdd: (product: ProductData) => void;
  transitionDelay?: number;
  priority?: boolean;
}

export default function ProductCard({
  product,
  onAdd,
  transitionDelay = 0,
  priority = false,
}: Props) {
  // Use primary image from images array, fall back to imageUrl
  const [imgFailed, setImgFailed] = useState(false);
  const primaryImage =
    product.images?.find((img) => img.isPrimary)?.url ||
    product.imageUrl ||
    PLACEHOLDER_SVG;

  const isOutOfStock = product.stockQuantity <= 0;

  return (
    <div
      className={`product-card fade-in visible${isOutOfStock ? " out-of-stock" : ""}`}
      style={{ transitionDelay: `${transitionDelay}s` }}
      role="listitem"
    >
      <Link href={`/catalogue/${product.id}`} className="product-card-image-link">
        <div className="product-card-image">
          <Image
            src={imgFailed ? PLACEHOLDER_SVG : primaryImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="product-card-img"
            quality={PRODUCT_IMAGE_QUALITY}
            placeholder="blur"
            blurDataURL={BLUR_PLACEHOLDER}
            loading={priority ? "eager" : "lazy"}
            priority={priority}
            onError={() => setImgFailed(true)}
          />
          {product.badge && !isOutOfStock && (
            <span className="product-card-badge">{product.badge}</span>
          )}
          {isOutOfStock && (
            <div className="product-card-out-of-stock-overlay" aria-hidden="true">
              <span className="product-card-out-of-stock-label">Out of Stock</span>
              <span className="product-card-out-of-stock-sub">
                Please wait until we restock this
              </span>
            </div>
          )}
        </div>
      </Link>
      <div className="product-card-body">
        <div className="product-card-category">
          {product.category?.name || "General"}
        </div>
        <Link href={`/catalogue/${product.id}`} className="product-card-title-link">
          <h3>{product.name}</h3>
        </Link>
        <div className="product-card-description">
          <ReactMarkdown>{product.description}</ReactMarkdown>
        </div>
        <div className="product-card-footer">
          <span className="product-card-price">
            {product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price) ? (
              <>
                <span className="product-card-price-original">₹{Number(product.compareAtPrice).toFixed(2)}</span>
                ₹{Number(product.price).toFixed(2)}
              </>
            ) : (
              <>₹{Number(product.price).toFixed(2)}</>
            )}
          </span>
          <StockBadge stockQuantity={product.stockQuantity} />
          <button
            className="btn-add"
            disabled={isOutOfStock}
            onClick={() => onAdd(product)}
          >
            {isOutOfStock ? "Sold Out" : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
}


