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

interface AddItemResult {
  result: "added" | "max_reached" | "max_one" | "out_of_stock";
  /**
   * Cart total immediately after this add — computed from the fresh state
   * inside the update, never from the stale snapshot callers would otherwise
   * have to compensate for (the bug behind the ₹0 shipping-nudge popup).
   * Meaningless on failure results; callers only read it on "added".
   */
  newTotal: number;
}

/** Revenue-bearing total: parent lines plus their gift-box lines; the surprise gift is free. */
function computeItemsTotal(items: CartItemDisplay[]): number {
  return items.reduce((sum, i) => {
    if (i.isGift) return sum;
    const itemTotal = i.price * i.quantity;
    const giftBoxTotal = i.giftBoxes?.reduce((gbSum, gb) => gbSum + gb.price * gb.quantity, 0) ?? 0;
    return sum + itemTotal + giftBoxTotal;
  }, 0);
}

interface CartContextType {
  items: CartItemDisplay[];
  addItem: (product: AddItemProduct) => AddItemResult;
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

  // Write-side source of truth. Every mutator computes its next state from
  // `itemsRef.current` and commits it through `commitItems`, which updates
  // the ref and React state together. This is what lets addItem return the
  // post-add total: the caller gets the total of the exact state the add
  // produced, computed synchronously — React does not run the setState
  // updater at dispatch time, so `getTotal()` after an add (or several adds
  // in one tick, like the quantity loop on the product page) would see stale
  // state. That stale read was the bug behind the ₹0 shipping-nudge popup.
  const itemsRef = useRef<CartItemDisplay[]>(initialItems);

  const commitItems = useCallback((next: CartItemDisplay[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem("luxe_cart");
    if (raw) {
      try {
        const localItems: CartItemDisplay[] = JSON.parse(raw);
        const timer = setTimeout(() => commitItems(ensureGiftItem(localItems)), 0);
        hasLoadedCart.current = true;
        return () => clearTimeout(timer);
      } catch {
        // ignore, keep initialItems
      }
    }
    hasLoadedCart.current = true;
  }, [commitItems]);

  // Persist on change
  useEffect(() => {
    if (!hasLoadedCart.current) return;
    saveCart(items);
    setCartCookieClient(toCartCookie(items));
  }, [items]);

  const addItem = useCallback(
    (product: AddItemProduct): AddItemResult => {
      const prev = itemsRef.current;
      if (product.stock <= 0) {
        return { result: "out_of_stock", newTotal: computeItemsTotal(prev) };
      }
      const existing = prev.find((i) => i.productId === product.id);
      let next: CartItemDisplay[];
      if (existing) {
        if (existing.quantity >= product.stock) {
          const result = product.stock === 1 ? "max_one" : "max_reached";
          return { result, newTotal: computeItemsTotal(prev) };
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
      next = ensureGiftItem(next);
      commitItems(next);
      // The authoritative post-add total: computed from the state this add
      // just produced and published, not from a stale snapshot.
      return { result: "added", newTotal: computeItemsTotal(next) };
    },
    [commitItems],
  );

  const removeItem = useCallback((productId: string) => {
    // Linked gift boxes are stored on the parent item, so removing the
    // parent removes them with it.
    const next = itemsRef.current.filter((i) => i.productId !== productId);
    commitItems(ensureGiftItem(next));
  }, [commitItems]);

  const updateQuantity = useCallback(
    (productId: string, delta: number): "updated" | "max_reached" | "max_one" | "removed" | "unchanged" => {
      let result: "updated" | "max_reached" | "max_one" | "removed" | "unchanged" = "unchanged";
      const next = itemsRef.current
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
      if (result !== "unchanged") {
        commitItems(ensureGiftItem(next));
      }
      return result;
    },
    [commitItems],
  );

  const updateGiftBoxes = useCallback((parentProductId: string, giftBoxes: CartGiftBox[]) => {
    const next = itemsRef.current.map((i) =>
      i.productId === parentProductId
        ? { ...i, giftBoxes: giftBoxes.length > 0 ? giftBoxes.map((gb) => ({ ...gb })) : undefined }
        : i,
    );
    commitItems(ensureGiftItem(next));
  }, [commitItems]);

  const removeGiftBox = useCallback((parentProductId: string, giftBoxProductId: string) => {
    const next = itemsRef.current.map((i) => {
      if (i.productId !== parentProductId || !i.giftBoxes) return i;
      const remaining = i.giftBoxes.filter((gb) => gb.productId !== giftBoxProductId);
      return { ...i, giftBoxes: remaining.length > 0 ? remaining : undefined };
    });
    commitItems(ensureGiftItem(next));
  }, [commitItems]);

  const clearCart = useCallback(() => {
    commitItems([]);
  }, [commitItems]);

  const getTotal = useCallback(() => computeItemsTotal(items), [items]);

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
