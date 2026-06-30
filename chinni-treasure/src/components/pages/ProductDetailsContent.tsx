"use client";

import { useCallback, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useCart } from "@/src/components/cart/CartProvider";
import { useToast } from "@/src/components/ui/ToastProvider";
import StockBadge from "@/src/components/ui/StockBadge";
import ProductImageGallery from "@/src/components/ui/ProductImageGallery";
import type { ProductImageData } from "@/src/components/ui/ProductCard";

interface ProductDetails {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
    description: string;
    category: { name: string } | null;
    stockQuantity: number;
    badge: string | null;
    sku: string | null;
    images: ProductImageData[];
}

interface Props {
    product: ProductDetails;
}

export default function ProductDetailsContent({ product }: Props) {
    const { addItem } = useCart();
    const { showToast } = useToast();
    const [quantity, setQuantity] = useState(1);

    const allImages = product.images.length > 0
        ? product.images
        : product.imageUrl
            ? [{ id: "primary", url: product.imageUrl, isPrimary: true, displayOrder: 0 }]
            : [];

    const handleAddToCart = useCallback(() => {
        if (product.stockQuantity <= 0) {
            showToast(`${product.name} is out of stock`, "error");
            return;
        }
        for (let i = 0; i < quantity; i++) {
            const result = addItem({
                id: product.id,
                name: product.name,
                price: Number(product.price),
                image: product.imageUrl,
                stock: product.stockQuantity,
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
        showToast(`${quantity} × ${product.name} added to cart`, "success");
    }, [product, quantity, addItem, showToast]);

    return (
        <div className="product-details-page">
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
                        ₹{Number(product.price).toFixed(2)}
                    </p>

                    <div className="product-details-stock">
                        <StockBadge stockQuantity={product.stockQuantity} />
                    </div>

                    {product.sku && (
                        <p className="product-details-sku">
                            SKU: <span>{product.sku}</span>
                        </p>
                    )}

                    <div className="product-details-description">
                        <h3>Description</h3>
                        <div className="product-description-markdown">
                            <ReactMarkdown>{product.description}</ReactMarkdown>
                        </div>
                    </div>

                    <div className="product-details-actions">
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
                            className="btn btn-primary btn-lg product-details-add-btn"
                            onClick={handleAddToCart}
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
