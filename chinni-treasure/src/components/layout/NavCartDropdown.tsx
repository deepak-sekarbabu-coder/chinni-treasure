"use client";

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
  open: boolean;
  onRemove: (id: string) => void;
  onClose: () => void;
}

export default function NavCartDropdown({ items, total, open, onRemove, onClose }: Props) {
  return (
    <div className={`cart-dropdown${open ? " active" : ""}`} role="region" aria-label="Shopping cart preview">
      <h4>Shopping Cart</h4>
      <div className="cart-dropdown-items" id="cart-dropdown-items">
        {items.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center", padding: "24px 0" }}>
            Your cart is empty
          </p>
        ) : (
          items.map((item) => (
            <div key={item.productId} className="cart-dropdown-item">
              <Image src={item.image || "/placeholder.svg"} alt={item.name} width={50} height={60} sizes="50px" quality={85} />
              <div className="cart-dropdown-item-info">
                <h5>{item.name}</h5>
                <p>Qty: {item.quantity} &times; ₹{item.price.toFixed(2)}</p>
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
      <div className="cart-dropdown-total">
        <span>Total:</span>
        <span id="cart-dropdown-total">₹{total.toFixed(2)}</span>
      </div>
      <Link href="/order" className="btn btn-dark" style={{ width: "100%" }} onClick={onClose}>
        View Cart & Checkout
      </Link>
    </div>
  );
}
