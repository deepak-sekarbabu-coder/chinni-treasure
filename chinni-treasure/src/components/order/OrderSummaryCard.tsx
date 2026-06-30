"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  image?: string;
}

interface Props {
  items: CartItem[];
  total: number;
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
}

export default function OrderSummaryCard({ items, total, onRemove, onUpdateQuantity }: Props) {
  const [summaryOpen, setSummaryOpen] = useState(true);

  return (
    <div className="admin-stat-card order-summary-card" style={{ textAlign: "left" }}>
      <h3 className="order-summary-title order-summary-title-desktop">
        Order Summary{items.length > 0 && ` (${items.length})`}
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
                <div key={item.productId} className="order-summary-item">
                  <Image
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    width={60}
                    height={70}
                    className="order-summary-item-img"
                  />
                  <div className="order-summary-item-info">
                    <h4 className="order-summary-item-name">{item.name}</h4>
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
                        title={item.quantity >= item.stock ? `Maximum available quantity reached (${item.stock} in stock)` : "Increase quantity"}
                        aria-label={item.quantity >= item.stock ? `Maximum quantity reached for ${item.name}` : `Increase quantity for ${item.name}`}
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
                    {item.quantity >= item.stock && item.stock > 1 && (
                      <p style={{ marginTop: "6px", fontSize: "0.7rem", color: "var(--warning)", letterSpacing: "0.2px" }}>
                        Max available quantity reached ({item.stock} in stock)
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="order-summary-totals">
              <div className="order-summary-total-row">
                <span>Subtotal</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
              <div className="order-summary-total-row">
                <span>Shipping</span>
                <span className="order-summary-free-shipping">Free</span>
              </div>
              <div className="order-summary-grand-total">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
