"use client";

import { useState } from "react";
import Link from "next/link";
import FallbackImage from "@/src/components/ui/FallbackImage";

import { FREE_SHIPPING_THRESHOLD } from "@/src/lib/pricing";
import { formatRupees } from "@/src/lib/format";

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  image?: string;
  isGift?: boolean;
  giftBoxes?: Array<{ productId: string; name: string; price: number; image: string; quantity: number }>;
}

interface Props {
  items: CartItem[];
  total: number;
  shippingCost: number;
  grandTotal: number;
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
}


export default function OrderSummaryCard({ items, total, shippingCost, grandTotal, onRemove, onUpdateQuantity }: Props) {
  const [summaryOpen, setSummaryOpen] = useState(true);

  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - total);
  const progressPercent = Math.min(100, Math.max(0, (total / FREE_SHIPPING_THRESHOLD) * 100));
  const displayCount = items.filter((i) => !i.isGift).length;

  return (
    <div className="admin-stat-card order-summary-card" style={{ textAlign: "left" }}>
      <h3 className="order-summary-title order-summary-title-desktop">
        Order Summary{displayCount > 0 && ` (${displayCount})`}
      </h3>

      <button
        type="button"
        className="order-summary-toggle"
        onClick={() => setSummaryOpen((s) => !s)}
        aria-expanded={summaryOpen}
        aria-controls="order-summary-content"
      >
        <span className="order-summary-toggle-label">
          Order Summary
          {items.length > 0 && (
            <span className="order-summary-toggle-count">{items.length}</span>
          )}
        </span>
        <svg
          className={`order-summary-chevron${summaryOpen ? " open" : ""}`}
          width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <div
        id="order-summary-content"
        className={`order-summary-collapse${summaryOpen ? " open" : ""}`}
      >
        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <p style={{ color: "var(--text-muted)", marginBottom: "16px" }}>Your cart is empty</p>
            <Link href="/catalogue" className="btn btn-primary">
              Browse Products
            </Link>
          </div>
        ) : (
          <>
            <div className="order-summary-items">
              {items.map((item) => (
                <div key={item.productId} className={`order-summary-item${item.isGift ? " order-summary-item-gift" : ""}`}>
                  <FallbackImage
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    width={60}
                    height={70}
                    sizes="60px"
                    quality={75}
                    className="order-summary-item-img"
                  />
                  <div className="order-summary-item-info">
                    <h4 className="order-summary-item-name">
                      {item.name}
                      {item.isGift && <span className="cart-gift-badge">FREE GIFT</span>}
                    </h4>
                    {item.isGift ? (
                      <p className="order-summary-item-price cart-gift-price">Complimentary</p>
                    ) : (
                      <>
                        <p className="order-summary-item-price">₹{item.price.toFixed(2)} each</p>
                        <div className="order-summary-item-qty">
                          <button
                            className="btn-secondary qty-btn"
                            onClick={() => item.quantity <= 1 ? onRemove(item.productId) : onUpdateQuantity(item.productId, -1)}
                            disabled={item.quantity < 1}
                          >
                            −
                          </button>
                          <span className="qty-value">{item.quantity}</span>
                          <button
                            className="btn-secondary qty-btn"
                            onClick={() => onUpdateQuantity(item.productId, 1)}
                            disabled={item.quantity >= item.stock}
                            title={item.quantity >= item.stock ? (item.stock === 1 ? "Max 1 Qty per user" : `Maximum available quantity reached (${item.stock} in stock)`) : "Increase quantity"}
                            aria-label={item.quantity >= item.stock ? (item.stock === 1 ? `Max 1 Qty per user for ${item.name}` : `Maximum quantity reached for ${item.name}`) : `Increase quantity for ${item.name}`}
                          >
                            +
                          </button>
                          <button
                            className="order-summary-remove"
                            onClick={() => onRemove(item.productId)}
                            aria-label={`Remove ${item.name}`}
                          >
                            ✕
                          </button>
                        </div>
                        {item.quantity >= item.stock && item.stock === 1 && (
                          <p style={{ marginTop: "6px", fontSize: "0.7rem", color: "var(--warning)", letterSpacing: "0.2px" }}>
                            Max 1 Qty per user
                          </p>
                        )}
                        {item.quantity >= item.stock && item.stock > 1 && (
                          <p style={{ marginTop: "6px", fontSize: "0.7rem", color: "var(--warning)", letterSpacing: "0.2px" }}>
                            Max available quantity reached ({item.stock} in stock)
                          </p>
                        )}
                        {item.giftBoxes && item.giftBoxes.length > 0 && (
                          <div className="gift-box-linked-items">
                            {item.giftBoxes.map((gb) => (
                              <div key={gb.productId} className="gift-box-linked-item">
                                <FallbackImage src={gb.image || "/placeholder.svg"} alt={gb.name} width={32} height={32} className="gift-box-linked-img" />
                                <span className="gift-box-linked-name">📦 {gb.name}</span>
                                <span className="gift-box-linked-qty">×{gb.quantity}</span>
                                <span className="gift-box-linked-price">₹{(gb.price * gb.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Free Shipping Nudge Box during Checkout */}
            {total < FREE_SHIPPING_THRESHOLD ? (
              <div className="checkout-shipping-nudge-box">
                <div className="checkout-nudge-header">
                  <span className="checkout-nudge-icon">🚚</span>
                  <div className="checkout-nudge-text">
                    <p className="checkout-nudge-title">
                      Add <strong>₹{formatRupees(remainingForFreeShipping)}</strong> more for <strong>FREE Shipping</strong>
                    </p>
                    <p className="checkout-nudge-sub">
                      Subtotal ₹{formatRupees(total)} of ₹{formatRupees(FREE_SHIPPING_THRESHOLD)}
                    </p>
                  </div>
                </div>
                <div
                  className="checkout-nudge-progress-track"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={FREE_SHIPPING_THRESHOLD}
                  aria-valuenow={Math.min(FREE_SHIPPING_THRESHOLD, Math.round(total))}
                  aria-valuetext={`${formatRupees(total)} of ₹${formatRupees(FREE_SHIPPING_THRESHOLD)} spent`}
                >
                  <div className="checkout-nudge-progress-fill" style={{ width: `${progressPercent}%` }} />
                </div>
                <Link href="/catalogue" className="btn btn-secondary btn-sm checkout-nudge-add-btn">
                  + Add items
                </Link>
              </div>
            ) : (
              <div className="checkout-free-shipping-unlocked" aria-live="polite">
                🎉 Free shipping unlocked!
              </div>
            )}

            <div className="order-summary-totals">
              <div className="order-summary-total-row">
                <span>Subtotal</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
              <div className="order-summary-total-row">
                <span>Shipping</span>
                {shippingCost < 0 ? (
                  <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>&#x2014;</span>
                ) : shippingCost === 0 ? (
                  <span className="order-summary-free-shipping">Free</span>
                ) : (
                  <span>₹{shippingCost.toFixed(2)}</span>
                )}
              </div>
              <div className="order-summary-grand-total">
                <span>Total</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
