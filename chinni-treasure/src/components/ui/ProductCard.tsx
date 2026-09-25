"use client";

import { useRef, useState } from "react";
import FallbackImage from "@/src/components/ui/FallbackImage";
import Link from "next/link";
import Markdown from "./Markdown";
import StockBadge from "./StockBadge";
import {
  PRODUCT_IMAGE_QUALITY,
  BLUR_PLACEHOLDER,
  IMAGE_UNAVAILABLE_PLACEHOLDER,
} from "@/src/lib/images";
import { productDisplayView } from "@/src/lib/product-display";
import { formatMoney } from "@/src/lib/format";

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
  sku: string | null;
  allowGiftBoxBundling?: boolean;
  images?: ProductImageData[];
}

interface Props {
  product: ProductData;
  onAdd: (product: ProductData) => void;
  transitionDelay?: number;
  priority?: boolean;
  loadImageImmediately?: boolean;
  onImageSettled?: () => void;
}

export default function ProductCard({
  product,
  onAdd,
  transitionDelay = 0,
  priority = false,
  loadImageImmediately = false,
  onImageSettled,
}: Props) {
  // Use primary image from images array, fall back to imageUrl
  const [imgFailed, setImgFailed] = useState(false);
  const imageSettledRef = useRef(false);
  // Shared display contract: primary-image pick + placeholder fallback + stock state.
  const view = productDisplayView(product);

  const isOutOfStock = view.stock === "out";

  const settleImage = () => {
    if (imageSettledRef.current) return;
    imageSettledRef.current = true;
    onImageSettled?.();
  };

  return (
    <div
      className={`product-card fade-in visible${isOutOfStock ? " out-of-stock" : ""}`}
      style={{ transitionDelay: `${transitionDelay}s` }}
      role="listitem"
    >
      <Link href={`/catalogue/${product.id}`} className="product-card-image-link">
        <div className="product-card-image">
          <FallbackImage
            src={imgFailed ? IMAGE_UNAVAILABLE_PLACEHOLDER : view.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="product-card-img"
            quality={PRODUCT_IMAGE_QUALITY}
            placeholder="blur"
            blurDataURL={BLUR_PLACEHOLDER}
            loading={priority || loadImageImmediately ? "eager" : "lazy"}
            priority={priority || loadImageImmediately}
            onLoad={settleImage}
            onError={() => {
              setImgFailed(true);
              // A failed image is still settled: FallbackImage will provide
              // the placeholder and the catalogue must remain usable.
              settleImage();
            }}
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
          <Markdown>{product.description ?? ""}</Markdown>
        </div>
        <div className="product-card-footer">
          <span className="product-card-price">
            {view.hasDiscount && view.compareAtPrice != null ? (
              <>
                <span className="product-card-price-original">{formatMoney(view.compareAtPrice)}</span>
                {formatMoney(view.price)}
              </>
            ) : (
              <>{formatMoney(view.price)}</>
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


