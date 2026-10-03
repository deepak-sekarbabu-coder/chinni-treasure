"use client";

import { useCallback, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import Markdown from "@/src/components/ui/Markdown";
import ShippingNudgePopup from "@/src/components/ui/ShippingNudgePopup";
import StockBadge from "@/src/components/ui/StockBadge";
import ProductImageGallery from "@/src/components/ui/ProductImageGallery";
import GiftBoxSelector, { type SelectedGiftBox } from "@/src/components/pages/GiftBoxSelector";
import type { ProductDetailView } from "@/src/lib/product-read";
import { useShippingNudge } from "@/src/lib/hooks/useShippingNudge";
import { useAddToCart } from "@/src/lib/hooks/useAddToCart";
import { productDisplayView } from "@/src/lib/product-display";
import { canBundleGiftBoxes } from "@/src/lib/gift-box";
import { formatMoney } from "@/src/lib/format";

interface Props {
    product: ProductDetailView;
}

export default function ProductDetailsContent({ product }: Props) {
    const {
        show: shippingNudgeShow,
        newTotal: shippingNudgeTotal,
        shippingLeft: shippingNudgeLeft,
        trigger: triggerShippingNudge,
        dismiss: dismissShippingNudge,
    } = useShippingNudge();
    const [quantity, setQuantity] = useState(1);
    const [selectedGiftBoxes, setSelectedGiftBoxes] = useState<SelectedGiftBox[]>([]);

    // The gallery takes image objects (it needs id/isPrimary for the strip), so
    // this is a shape adapter onto the single-image fallback, not a re-pick.
    const allImages = product.images.length > 0
        ? product.images
        : product.imageUrl
            ? [{ id: "primary", url: product.imageUrl, isPrimary: true, displayOrder: 0 }]
            : [];

    // Shared display contract: discount math + low-stock threshold.
    const view = productDisplayView(product);

    const addBtnRef = useRef<HTMLButtonElement>(null);
    const [btnSuccess, setBtnSuccess] = useState(false);
    // No `giftBox` bundle here: this surface always passes `giftBoxes`, so the
    // decision is made here and the seam never opens its modal.
    const { handleAdd } = useAddToCart({ triggerShippingNudge });

    const handleRipple = useCallback((e: ReactMouseEvent<HTMLButtonElement>) => {
        const btn = e.currentTarget;
        const rect = btn.getBoundingClientRect();
        const ripple = document.createElement("span");
        ripple.className = "btn-ripple";
        ripple.style.left = `${e.clientX - rect.left}px`;
        ripple.style.top = `${e.clientY - rect.top}px`;
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 500);
    }, []);

    const handleAddToCart = useCallback(() => {
        // `giftBoxes` present means the decision is made, so the seam adds
        // straight away instead of opening its modal — this surface collects
        // the customer's own box picks above the button.
        handleAdd(
          product,
          { giftBoxes: selectedGiftBoxes, pressedFrom: addBtnRef.current, quantity },
        );
        setBtnSuccess(true);
        setTimeout(() => setBtnSuccess(false), 600);
    }, [product, quantity, selectedGiftBoxes, handleAdd]);

    return (
        <div className="product-details-page">
            <ShippingNudgePopup
                show={shippingNudgeShow}
                newTotal={shippingNudgeTotal}
                shippingLeft={shippingNudgeLeft}
                dismiss={dismissShippingNudge}
            />
            <div className="product-details-container">
                {/* Image Gallery */}
                <div className="product-details-gallery">
                    <ProductImageGallery images={allImages} productName={product.name} />
                </div>

                {/* Product Info */}
                <div className="product-details-info">
                    {product.category && (
                        <p className="product-details-category">{product.category.name}</p>
                    )}
                    <h1 className="product-details-title">{product.name}</h1>

                    {view.badge && (
                        <span className="product-card-badge product-details-badge">
                            {view.badge}
                        </span>
                    )}

                    <p className="product-details-price">
                        {view.hasDiscount && view.compareAtPrice != null ? (
                            <>
                                <span className="product-details-price-original">{formatMoney(view.compareAtPrice)}</span>
                                {formatMoney(view.price)}
                            </>
                        ) : (
                            <>{formatMoney(view.price)}</>
                        )}
                    </p>

                    <div className="product-details-stock">
                        <StockBadge stockQuantity={product.stockQuantity} />
                    </div>

                    {product.sku && (
                        <p className="product-details-sku">
                            Code: <span>{product.sku}</span>
                        </p>
                    )}

                    <div className="product-details-description">
                        <h2>Description</h2>
                        <div className="product-description-markdown">
                            <Markdown>{product.description}</Markdown>
                        </div>
                    </div>

                    <div className="product-details-actions">
                        {canBundleGiftBoxes(product) && (
                            <GiftBoxSelector
                                parentQuantity={quantity}
                                selected={selectedGiftBoxes}
                                onChange={setSelectedGiftBoxes}
                            />
                        )}
                        <div className="product-details-qty">
                            <button
                                className="btn-secondary qty-btn"
                                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                disabled={quantity <= 1}
                                aria-label="Decrease quantity"
                            >
                                −
                            </button>
                            <span className="qty-value">{quantity}</span>
                            <button
                                className="btn-secondary qty-btn"
                                onClick={() => setQuantity((q) => Math.min(product.stockQuantity, q + 1))}
                                disabled={quantity >= product.stockQuantity}
                                aria-label="Increase quantity"
                            >
                                +
                            </button>
                        </div>
                        <button
                            ref={addBtnRef}
                            className={`btn btn-primary btn-lg product-details-add-btn${btnSuccess ? " btn-success" : ""}`}
                            onClick={(e) => { handleRipple(e); handleAddToCart(); }}
                            disabled={product.stockQuantity <= 0}
                        >
                            {product.stockQuantity <= 0 ? "Sold Out" : "Add to Cart"}
                        </button>
                    </div>

                    {view.stock === "low" && (
                        <p className="product-details-low-stock">
                            Only {product.stockQuantity} left in stock — order soon
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
