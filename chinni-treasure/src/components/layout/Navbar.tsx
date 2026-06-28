"use client";

import { useState, useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCart } from "@/src/components/cart/CartProvider";
import NavCartDropdown from "@/src/components/layout/NavCartDropdown";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [bounceKey, setBounceKey] = useState(0);
  const { items, removeItem, getTotal, getCount } = useCart();
  const mounted = useSyncExternalStore(() => () => { }, () => true, () => false);
  const pathname = usePathname();
  const cartRef = useRef<HTMLDivElement>(null);
  const prevCount = useRef(0);

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

  useEffect(() => {
    if (count > 0 && count !== prevCount.current) {
      setBounceKey((k) => k + 1);
    }
    prevCount.current = count;
  }, [count]);

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
          <div className="brand-logo-wrap">
            <Image
              src="/images/branding/logo.png"
              alt="Chinni Treasure Little Love logo"
              width={64}
              height={64}
              className="brand-logo-image"
            />
          </div>
          <div className="brand-text-wrap" style={{ textAlign: "center" }}>
            <div style={{ fontWeight: "bold" }}>Chinni Treasure</div>
            <div style={{ fontSize: "1.08rem", textAlign: "center" }}>
              <span className="brand-heart">❤</span> <span className="brand-tagline">Little Love</span>{" "}
              <span className="brand-heart">❤</span>
            </div>
          </div>
        </Link>

        <div className="navbar-group">
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

          <div className="navbar-actions">
            <div className="navbar-cart" ref={cartRef}>
              <div
                className={`cart-overlay${cartOpen ? " active" : ""}`}
                onClick={() => setCartOpen(false)}
                aria-hidden="true"
              />
              <button
                onClick={() => setCartOpen(!cartOpen)}
                className="cart-btn"
                aria-label="Shopping cart"
              >
                <svg className="cart-icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                <span className="cart-label">Cart</span>
                {mounted && count > 0 && (
                  <span className="cart-count" aria-live="polite" style={{ animation: bounceKey ? 'countBounce 0.4s cubic-bezier(0.22, 1, 0.36, 1)' : undefined }}>
                    {count}
                  </span>
                )}
              </button>
              <NavCartDropdown
                items={items}
                total={total}
                open={cartOpen}
                onRemove={removeItem}
                onClose={() => { setCartOpen(false); setMenuOpen(false); }}
              />
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
        </div>
      </div>
    </nav>
  );
}
