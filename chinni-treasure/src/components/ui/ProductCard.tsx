"use client";

import { useRef } from "react";
import FallbackImage from "@/src/components/ui/FallbackImage";
import Link from "next/link";
import Markdown from "./Markdown";
import StockBadge from "./StockBadge";
import {
  PRODUCT_IMAGE_QUALITY,
  BLUR_PLACEHOLDER,
} from "@/src/lib/images";
import { productDisplayView } from "@/src/lib/product-display";
import { formatMoney } from "@/src/lib/format";
import type { CatalogueProduct } from "@/src/lib/api/schemas";

interface Props {
  // The card renders the catalogue contract itself, not a hand-rolled twin —
  // a schema field can no longer stop reaching the card without a type error.
  product: CatalogueProduct;
  onAdd: (product: CatalogueProduct) => void;
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
  // Use primary image from images array, fall back to imageUrl.
  // Load failure swaps to the placeholder inside FallbackImage.
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
            src={view.image}
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
            // A failed image is still settled: the catalogue must remain usable.
            onError={settleImage}
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


