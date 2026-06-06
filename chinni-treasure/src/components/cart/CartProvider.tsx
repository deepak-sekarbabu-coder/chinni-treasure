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

export interface CartItemDisplay {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  stock: number;
}

interface CartContextType {
  items: CartItemDisplay[];
  addItem: (product: {
    id: string;
    name: string;
    price: number;
    image: string;
    stock: number;
  }) => "added" | "max_reached" | "out_of_stock";
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => "updated" | "max_reached" | "removed" | "unchanged";
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
  return items.map((i) => ({ productId: i.productId, quantity: i.quantity }));
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
        const timer = setTimeout(() => setItems(localItems), 0);
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
    (product: { id: string; name: string; price: number; image: string; stock: number }) => {
      if (product.stock <= 0) return "out_of_stock" as const;
      let result: "added" | "max_reached" = "added";
      setItems((prev) => {
        const existing = prev.find((i) => i.productId === product.id);
        if (existing) {
          if (existing.quantity >= product.stock) {
            result = "max_reached";
            return prev;
          }
          return prev.map((i) =>
            i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i,
          );
        }
        return [
          ...prev,
          {
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            image: product.image,
            stock: product.stock,
          },
        ];
      });
      return result;
    },
    [],
  );

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const updateQuantity = useCallback(
    (productId: string, delta: number) => {
      let result: "updated" | "max_reached" | "removed" | "unchanged" = "unchanged";
      setItems((prev) =>
        prev
          .map((i) => {
            if (i.productId !== productId) return i;
            const newQty = i.quantity + delta;
            if (newQty <= 0) {
              result = "removed";
              return null;
            }
            if (newQty > i.stock) {
              result = "max_reached";
              return i;
            }
            result = "updated";
            return { ...i, quantity: newQty };
          })
          .filter(Boolean) as CartItemDisplay[],
      );
      return result;
    },
    [],
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getTotal = useCallback(() => {
    return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  }, [items]);

  const getCount = useCallback(() => {
    return items.reduce((sum, i) => sum + i.quantity, 0);
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
