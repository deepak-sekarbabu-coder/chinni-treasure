"use client";

import { useCallback, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import Markdown from "@/src/components/ui/Markdown";
import { useCart } from "@/src/components/cart/CartProvider";
import { useToast } from "@/src/components/ui/ToastProvider";
import ShippingNudgePopup from "@/src/components/ui/ShippingNudgePopup";
import StockBadge from "@/src/components/ui/StockBadge";
import ProductImageGallery from "@/src/components/ui/ProductImageGallery";
import GiftBoxSelector, { type SelectedGiftBox } from "@/src/components/pages/GiftBoxSelector";
import type { ProductImageData } from "@/src/components/ui/ProductCard";
import { useShippingNudge } from "@/src/lib/hooks/useShippingNudge";

interface ProductDetails {
    id: string;
    name: string;
    price: number;
    compareAtPrice?: number | null;
    imageUrl: string;
    description: string;
    category: { name: string } | null;
    stockQuantity: number;
    badge: string | null;
    sku: string | null;
    allowGiftBoxBundling?: boolean;
    images: ProductImageData[];
}

interface Props {
    product: ProductDetails;
}

export default function ProductDetailsContent({ product }: Props) {
    const { addItem } = useCart();
    const { showToast } = useToast();
    const {
        show: shippingNudgeShow,
        newTotal: shippingNudgeTotal,
        shippingLeft: shippingNudgeLeft,
        trigger: triggerShippingNudge,
        dismiss: dismissShippingNudge,
    } = useShippingNudge();
    const [quantity, setQuantity] = useState(1);
    const [selectedGiftBoxes, setSelectedGiftBoxes] = useState<SelectedGiftBox[]>([]);

    const allImages = product.images.length > 0
        ? product.images
        : product.imageUrl
            ? [{ id: "primary", url: product.imageUrl, isPrimary: true, displayOrder: 0 }]
            : [];

    const addBtnRef = useRef<HTMLButtonElement>(null);
    const [btnSuccess, setBtnSuccess] = useState(false);

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

    const handleAddToCart = useCallback((e: ReactMouseEvent<HTMLButtonElement>) => {
        if (product.stockQuantity <= 0) {
            showToast(`${product.name} is out of stock`, "error");
            return;
        }
        for (let i = 0; i < quantity; i++) {
            const result = addItem({
                id: product.id,
                name: product.name,
                price: Number(product.price),
                image: product.imageUrl ?? "",
                stock: product.stockQuantity,
                sku: product.sku ?? undefined,
                giftBoxes: i === 0 && selectedGiftBoxes.length > 0 ? selectedGiftBoxes : undefined,
            });
            if (result === "max_one") {
                showToast(`Max 1 Qty per user for ${product.name}`, "info");
                return;
            }
            if (result === "max_reached") {
                showToast(`Maximum available quantity reached (${product.stockQuantity} in stock)`, "info");
                return;
            }
            if (result === "out_of_stock") {
                showToast(`${product.name} is out of stock`, "error");
                return;
            }
        }
        triggerShippingNudge(Number(product.price), quantity);
        showToast(`${quantity} × ${product.name} added to cart`, "success");
        setBtnSuccess(true);
        setTimeout(() => setBtnSuccess(false), 600);
    }, [product, quantity, selectedGiftBoxes, addItem, showToast, triggerShippingNudge]);

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

                    {product.badge && (
                        <span className="product-card-badge product-details-badge">
                            {product.badge}
                        </span>
                    )}

                    <p className="product-details-price">
                        {product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price) ? (
                            <>
                                <span className="product-details-price-original">₹{Number(product.compareAtPrice).toFixed(2)}</span>
                                ₹{Number(product.price).toFixed(2)}
                            </>
                        ) : (
                            <>₹{Number(product.price).toFixed(2)}</>
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
                        {product.allowGiftBoxBundling && product.category?.name !== "Gift Boxes" && (
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
                            onClick={(e) => { handleRipple(e); handleAddToCart(e); }}
                            disabled={product.stockQuantity <= 0}
                        >
                            {product.stockQuantity <= 0 ? "Sold Out" : "Add to Cart"}
                        </button>
                    </div>

                    {product.stockQuantity > 1 && product.stockQuantity <= 5 && (
                        <p className="product-details-low-stock">
                            Only {product.stockQuantity} left in stock — order soon
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
