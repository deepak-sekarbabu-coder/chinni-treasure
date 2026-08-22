"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import type { CartItem } from "@/src/types";

export const SURPRISE_GIFT_PRODUCT_ID = "__surprise_gift__";
const SURPRISE_GIFT_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_SURPRISE_GIFT !== "false";

export interface CartItemDisplay {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  stock: number;
  sku?: string;
  isGift?: boolean;
}

const SURPRISE_GIFT_ITEM: CartItemDisplay = {
  productId: SURPRISE_GIFT_PRODUCT_ID,
  name: "Surprise Gift 🎁",
  price: 0,
  quantity: 1,
  image: "/images/OIP.webp",
  stock: 999,
  isGift: true,
};

function ensureGiftItem(items: CartItemDisplay[]): CartItemDisplay[] {
  if (!SURPRISE_GIFT_ENABLED) return items;
  const hasRealItems = items.some((i) => !i.isGift);
  const hasGift = items.some((i) => i.isGift);
  if (!hasRealItems) return items.filter((i) => !i.isGift);
  if (hasGift) return items;
  return [...items, SURPRISE_GIFT_ITEM];
}

interface CartContextType {
  items: CartItemDisplay[];
  addItem: (product: {
    id: string;
    name: string;
    price: number;
    image: string;
    stock: number;
    sku?: string;
  }) => "added" | "max_reached" | "max_one" | "out_of_stock";
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => "updated" | "max_reached" | "max_one" | "removed" | "unchanged";
  clearCart: () => void;
  getTotal: () => number;
  getCount: () => number;
}

const CartContext = createContext<CartContextType | null>(null);

function saveCart(items: CartItemDisplay[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("luxe_cart", JSON.stringify(items));
  } catch {
    // ignore
  }
}

function toCartCookie(items: CartItemDisplay[]): CartItem[] {
  return items
    .filter((i) => !i.isGift)
    .map((i) => ({ productId: i.productId, quantity: i.quantity }));
}

const CART_COOKIE = "cart";
const CART_MAX_AGE = 2592000; // 30 days
function setCartCookieClient(items: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    document.cookie = `${CART_COOKIE}=${encodeURIComponent(JSON.stringify(items))}; path=/; max-age=${CART_MAX_AGE}; samesite=lax`;
  } catch {
    // ignore
  }
}

export function CartProvider({ children, initialItems = [] }: { children: ReactNode; initialItems?: CartItemDisplay[] }) {
  const [items, setItems] = useState<CartItemDisplay[]>(initialItems);
  const hasLoadedCart = useRef(false);

  useEffect(() => {
    const raw = localStorage.getItem("luxe_cart");
    if (raw) {
      try {
        const localItems: CartItemDisplay[] = JSON.parse(raw);
        const timer = setTimeout(() => setItems(ensureGiftItem(localItems)), 0);
        hasLoadedCart.current = true;
        return () => clearTimeout(timer);
      } catch {
        // ignore, keep initialItems
      }
    }
    hasLoadedCart.current = true;
  }, []);

  // Persist on change
  useEffect(() => {
    if (!hasLoadedCart.current) return;
    saveCart(items);
    setCartCookieClient(toCartCookie(items));
  }, [items]);

  const addItem = useCallback(
    (product: { id: string; name: string; price: number; image: string; stock: number; sku?: string }) => {
      if (product.stock <= 0) return "out_of_stock" as const;
      let result: "added" | "max_reached" | "max_one" = "added";
      setItems((prev) => {
        const existing = prev.find((i) => i.productId === product.id);
        let next: CartItemDisplay[];
        if (existing) {
          if (existing.quantity >= product.stock) {
            result = product.stock === 1 ? "max_one" : "max_reached";
            return prev;
          }
          next = prev.map((i) =>
            i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i,
          );
        } else {
          next = [
            ...prev,
            {
              productId: product.id,
              name: product.name,
              price: product.price,
              quantity: 1,
              image: product.image,
              stock: product.stock,
              sku: product.sku,
            },
          ];
        }
        return ensureGiftItem(next);
      });
      return result;
    },
    [],
  );

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.productId !== productId);
      return ensureGiftItem(next);
    });
  }, []);

  const updateQuantity = useCallback(
    (productId: string, delta: number) => {
      let result: "updated" | "max_reached" | "max_one" | "removed" | "unchanged" = "unchanged";
      setItems((prev) => {
        const next = prev
          .map((i) => {
            if (i.productId !== productId) return i;
            const newQty = i.quantity + delta;
            if (newQty <= 0) {
              result = "removed";
              return null;
            }
            if (newQty > i.stock) {
              result = i.stock === 1 ? "max_one" : "max_reached";
              return i;
            }
            result = "updated";
            return { ...i, quantity: newQty };
          })
          .filter(Boolean) as CartItemDisplay[];
        return ensureGiftItem(next);
      });
      return result;
    },
    [],
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getTotal = useCallback(() => {
    return items.reduce((sum, i) => (i.isGift ? sum : sum + i.price * i.quantity), 0);
  }, [items]);

  const getCount = useCallback(() => {
    return items.reduce((sum, i) => (i.isGift ? sum : sum + i.quantity), 0);
  }, [items]);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, getTotal, getCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
