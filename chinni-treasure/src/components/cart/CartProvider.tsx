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

const SURPRISE_GIFT_PRODUCT_ID = "__surprise_gift__";
const SURPRISE_GIFT_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_SURPRISE_GIFT !== "false";

export interface CartGiftBox {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export interface CartItemDisplay {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  stock: number;
  sku?: string;
  isGift?: boolean;
  giftBoxes?: CartGiftBox[];
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

interface AddItemProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  stock: number;
  sku?: string;
  giftBoxes?: CartGiftBox[];
}

interface CartContextType {
  items: CartItemDisplay[];
  addItem: (product: AddItemProduct) => "added" | "max_reached" | "max_one" | "out_of_stock";
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => "updated" | "max_reached" | "max_one" | "removed" | "unchanged";
  updateGiftBoxes: (parentProductId: string, giftBoxes: CartGiftBox[]) => void;
  removeGiftBox: (parentProductId: string, giftBoxProductId: string) => void;
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
    .map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      giftBoxes: i.giftBoxes?.map((gb) => ({ productId: gb.productId, quantity: gb.quantity })),
    }));
}

function mergeGiftBoxes(
  current: CartGiftBox[] | undefined,
  incoming: CartGiftBox[] | undefined,
): CartGiftBox[] | undefined {
  if (!incoming || incoming.length === 0) return current;
  const merged = new Map<string, CartGiftBox>();
  for (const gb of current ?? []) merged.set(gb.productId, { ...gb });
  for (const gb of incoming) {
    const existing = merged.get(gb.productId);
    if (existing) existing.quantity += gb.quantity;
    else merged.set(gb.productId, { ...gb });
  }
  return Array.from(merged.values());
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
    (product: AddItemProduct) => {
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
          next = prev.map((i) => {
            if (i.productId !== product.id) return i;
            const merged = mergeGiftBoxes(i.giftBoxes, product.giftBoxes);
            return { ...i, quantity: i.quantity + 1, ...(merged && { giftBoxes: merged }) };
          });
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
              ...(product.giftBoxes?.length && {
                giftBoxes: product.giftBoxes.map((gb) => ({ ...gb })),
              }),
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
      // Linked gift boxes are stored on the parent item, so removing the
      // parent removes them with it.
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

  const updateGiftBoxes = useCallback((parentProductId: string, giftBoxes: CartGiftBox[]) => {
    setItems((prev) =>
      ensureGiftItem(
        prev.map((i) =>
          i.productId === parentProductId
            ? { ...i, giftBoxes: giftBoxes.length > 0 ? giftBoxes.map((gb) => ({ ...gb })) : undefined }
            : i,
        ),
      ),
    );
  }, []);

  const removeGiftBox = useCallback((parentProductId: string, giftBoxProductId: string) => {
    setItems((prev) =>
      ensureGiftItem(
        prev.map((i) => {
          if (i.productId !== parentProductId || !i.giftBoxes) return i;
          const remaining = i.giftBoxes.filter((gb) => gb.productId !== giftBoxProductId);
          return { ...i, giftBoxes: remaining.length > 0 ? remaining : undefined };
        }),
      ),
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getTotal = useCallback(() => {
    return items.reduce((sum, i) => {
      if (i.isGift) return sum;
      const itemTotal = i.price * i.quantity;
      const giftBoxTotal = i.giftBoxes?.reduce((gbSum, gb) => gbSum + gb.price * gb.quantity, 0) ?? 0;
      return sum + itemTotal + giftBoxTotal;
    }, 0);
  }, [items]);

  const getCount = useCallback(() => {
    return items.reduce((sum, i) => (i.isGift ? sum : sum + i.quantity), 0);
  }, [items]);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, updateGiftBoxes, removeGiftBox, clearCart, getTotal, getCount }}
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
