"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

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
  }) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getCount: () => number;
}

const CartContext = createContext<CartContextType | null>(null);

function loadCart(): CartItemDisplay[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("luxe_cart");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItemDisplay[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("luxe_cart", JSON.stringify(items));
  } catch {
    // ignore
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItemDisplay[]>([]);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setItems(loadCart());
  }, []);

  // Persist on change
  useEffect(() => {
    saveCart(items);
  }, [items]);

  const addItem = useCallback(
    (product: { id: string; name: string; price: number; image: string; stock: number }) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.productId === product.id);
        if (existing) {
          // Check stock limit
          if (existing.quantity >= product.stock) {
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
    },
    [],
  );

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const updateQuantity = useCallback(
    (productId: string, delta: number) => {
      setItems((prev) =>
        prev
          .map((i) => {
            if (i.productId !== productId) return i;
            const newQty = i.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > i.stock) return i;
            return { ...i, quantity: newQty };
          })
          .filter(Boolean) as CartItemDisplay[],
      );
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
