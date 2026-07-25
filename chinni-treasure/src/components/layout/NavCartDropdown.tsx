"use client";

import Link from "next/link";
import FallbackImage from "@/src/components/ui/FallbackImage";
import { FREE_SHIPPING_THRESHOLD } from "@/src/lib/constants";

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  stock: number;
}

interface Props {
  items: CartItem[];
  total: number;
  open: boolean;
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onClose: () => void;
}

export default function NavCartDropdown({ items, total, open, onRemove, onUpdateQuantity, onClose }: Props) {
  const shippingNote = total >= FREE_SHIPPING_THRESHOLD
    ? "Free shipping on this order"
    : `Free shipping on orders above ₹${FREE_SHIPPING_THRESHOLD.toLocaleString()}`;

  return (
    <div className={`cart-dropdown${open ? " active" : ""}`} role="region" aria-label="Shopping cart preview">
      <h4>Shopping Cart</h4>
      <div className="cart-dropdown-items" id="cart-dropdown-items">
        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "16px" }}>
              Your cart is empty
            </p>
            <Link href="/catalogue" className="btn btn-primary" style={{ fontSize: "0.7rem", padding: "12px 24px" }} onClick={onClose}>
              Continue Shopping
            </Link>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.productId} className="cart-dropdown-item">
              <FallbackImage src={item.image || "/placeholder.svg"} alt={item.name} width={50} height={60} sizes="50px" quality={75} />
              <div className="cart-dropdown-item-info">
                <h5>{item.name}</h5>
                <p className="cart-dropdown-item-price">₹{item.price.toFixed(2)} each</p>
                <div className="cart-dropdown-item-qty">
                  <button
                    className="cart-dropdown-qty-btn"
                    aria-label={`Decrease quantity of ${item.name}`}
                    onClick={() => item.quantity <= 1 ? onRemove(item.productId) : onUpdateQuantity(item.productId, -1)}
                    disabled={item.quantity < 1}
                  >
                    −
                  </button>
                  <span className="cart-dropdown-qty-value" aria-live="polite">{item.quantity}</span>
                  <button
                    className="cart-dropdown-qty-btn"
                    aria-label={`Increase quantity of ${item.name}`}
                    onClick={() => onUpdateQuantity(item.productId, 1)}
                    disabled={item.quantity >= item.stock}
                    title={item.quantity >= item.stock ? (item.stock === 1 ? "Max 1 per user" : `Only ${item.stock} in stock`) : "Increase quantity"}
                  >
                    +
                  </button>
                </div>
                {item.stock <= 3 && item.stock > 0 && (
                  <p className="cart-dropdown-low-stock">Only {item.stock} left</p>
                )}
              </div>
              <button
                className="cart-dropdown-item-remove"
                aria-label={`Remove ${item.name} from cart`}
                onClick={() => onRemove(item.productId)}
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
      {items.length > 0 && (
        <div className="cart-dropdown-shipping-note">
          <span>{shippingNote}</span>
        </div>
      )}
      <div className="cart-dropdown-total">
        <span>Total</span>
        <span id="cart-dropdown-total">₹{total.toFixed(2)}</span>
      </div>
      {items.length > 0 && (
        <div className="cart-dropdown-actions">
          <Link href="/order" className="btn btn-dark cart-dropdown-view-cart" onClick={onClose}>
            View Cart
          </Link>
          <Link href="/order" className="btn btn-primary cart-dropdown-checkout-btn" onClick={onClose}>
            Checkout
          </Link>
        </div>
      )}
      {items.length === 0 && (
        <Link href="/catalogue" className="btn btn-primary cart-dropdown-browse-btn" onClick={onClose}>
          Browse Products
        </Link>
      )}
    </div>
  );
}
