"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/src/components/cart/CartProvider";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { items, removeItem, getTotal, getCount } = useCart();
  const pathname = usePathname();
  const cartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (cartRef.current && !cartRef.current.contains(e.target as Node)) {
        setCartOpen(false);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const count = getCount();
  const total = getTotal();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav
      className={`navbar${scrolled ? " scrolled" : ""}`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="navbar-inner">
        <Link href="/" className="nav-brand" aria-label="Chinni Treasure - Little Love home page">
          Chinni Treasure
          <span>Little Love</span>
        </Link>

        <div className="navbar-actions">
          <div className="navbar-cart" ref={cartRef}>
            <button
              onClick={() => setCartOpen(!cartOpen)}
              className="cart-btn"
              aria-label={`Shopping cart with ${count} items`}
            >
              <svg className="cart-icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="9" cy="21" r="1"/>
                <circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              <span className="cart-label">Cart</span>
              {count > 0 && (
                <span className="cart-count" aria-live="polite">
                  {count}
                </span>
              )}
            </button>
            <div
              className={`cart-dropdown${cartOpen ? " active" : ""}`}
              role="region"
              aria-label="Shopping cart preview"
            >
              <h4>Shopping Cart</h4>
              <div className="cart-dropdown-items" id="cart-dropdown-items">
                {items.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center", padding: "24px 0" }}>
                    Your cart is empty
                  </p>
                ) : (
                  items.map((item) => (
                    <div key={item.productId} className="cart-dropdown-item">
                      <img src={item.image || "/placeholder.svg"} alt={item.name} />
                      <div className="cart-dropdown-item-info">
                        <h5>{item.name}</h5>
                        <p>
                          Qty: {item.quantity} &times; ₹{item.price.toFixed(2)}
                        </p>
                      </div>
                      <button
                        className="cart-dropdown-item-remove"
                        aria-label={`Remove ${item.name} from cart`}
                        onClick={() => removeItem(item.productId)}
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
              <Link href="/order" className="btn btn-dark" style={{ width: "100%" }} onClick={() => { setCartOpen(false); setMenuOpen(false); }}>
                View Cart & Checkout
              </Link>
            </div>
          </div>

          <button
            className={`hamburger${menuOpen ? " active" : ""}`}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            aria-controls="nav-links"
            onClick={() => {
              setMenuOpen(!menuOpen);
              if (cartOpen) setCartOpen(false);
            }}
          >
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
          </button>
        </div>

        <ul className={`nav-links${menuOpen ? " active" : ""}`} id="nav-links" role="menubar">
          <li role="none">
            <Link
              href="/"
              className={isActive("/") && pathname === "/" ? "active" : ""}
              role="menuitem"
              aria-current={pathname === "/" ? "page" : undefined}
              onClick={() => { setMenuOpen(false); setCartOpen(false); }}
            >
              Home
            </Link>
          </li>
          <li role="none">
            <Link
              href="/catalogue"
              className={isActive("/catalogue") ? "active" : ""}
              role="menuitem"
              onClick={() => { setMenuOpen(false); setCartOpen(false); }}
            >
              Catalogue
            </Link>
          </li>
          <li role="none">
            <Link
              href="/track"
              className={isActive("/track") ? "active" : ""}
              role="menuitem"
              onClick={() => { setMenuOpen(false); setCartOpen(false); }}
            >
              Track
            </Link>
          </li>
          <li role="none">
            <Link
              href="/admin"
              className={isActive("/admin") ? "active" : ""}
              role="menuitem"
              onClick={() => { setMenuOpen(false); setCartOpen(false); }}
            >
              Admin
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
