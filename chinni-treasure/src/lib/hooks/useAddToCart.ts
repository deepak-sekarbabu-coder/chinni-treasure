"use client";

import { useCallback } from "react";
import { useCart } from "@/src/components/cart/CartProvider";
import { useToast } from "@/src/components/ui/ToastProvider";

/** Minimal product shape shared by CatalogueProduct and ProductData. */
export interface AddableProduct {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  stockQuantity: number;
  sku: string | null;
  category: { name: string } | null;
  allowGiftBoxBundling?: boolean;
}

interface GiftBoxItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

/**
 * Shared add-to-cart logic for catalogue and category pages.
 * Returns handleAddDirectly, handleAdd, and handleModalConfirm.
 */
export function useAddToCart<T extends AddableProduct>(options: {
  onOpenGiftBoxModal: (product: T) => void;
  triggerShippingNudge: (productPrice: number, quantity: number) => void;
}) {
  const { addItem } = useCart();
  const { showToast } = useToast();

  const handleAddDirectly = useCallback(
    (p: T, giftBoxes?: GiftBoxItem[]) => {
      if (p.stockQuantity <= 0) {
        showToast(`${p.name} is out of stock`, "error");
        return;
      }
      const addResult = addItem({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        image: p.imageUrl ?? "",
        stock: p.stockQuantity,
        sku: p.sku ?? undefined,
        giftBoxes,
      });
      if (addResult === "max_one") {
        showToast(`Max 1 Qty per user for ${p.name}`, "info");
        return;
      }
      if (addResult === "max_reached") {
        showToast(
          `Maximum available quantity reached for ${p.name} (${p.stockQuantity})`,
          "info",
        );
        return;
      }
      if (addResult === "out_of_stock") {
        showToast(`${p.name} is out of stock`, "error");
        return;
      }
      const giftQty = giftBoxes?.reduce((sum, b) => sum + b.quantity, 0) ?? 0;
      options.triggerShippingNudge(Number(p.price), giftQty);
      showToast(`${p.name} added to cart`, "success");
    },
    [addItem, showToast, options.triggerShippingNudge],
  );

  const handleAdd = useCallback(
    (p: T) => {
      if (p.allowGiftBoxBundling && p.category?.name !== "Gift Boxes") {
        options.onOpenGiftBoxModal(p);
        return;
      }
      handleAddDirectly(p);
    },
    [handleAddDirectly, options.onOpenGiftBoxModal],
  );

  const handleModalConfirm = useCallback(
    (
      modalProduct: { id: string; name: string; price: number; image: string } | null,
      giftBoxes: GiftBoxItem[],
    ) => {
      if (modalProduct) {
        handleAddDirectly(
          {
            ...modalProduct,
            imageUrl: modalProduct.image,
            stockQuantity: 1,
            description: null,
            badge: null,
            sku: null,
            category: null,
          } as unknown as T,
          giftBoxes.length > 0 ? giftBoxes : undefined,
        );
        // Trigger the shipping nudge so the popup reflects the cart total
        // including any gift boxes the customer just selected.
        const giftBoxTotal = giftBoxes.reduce((sum, b) => sum + b.price * b.quantity, 0);
        if (giftBoxes.length > 0) {
          options.triggerShippingNudge(Number(modalProduct.price), 1 + giftBoxes.reduce((sum, b) => sum + b.quantity, 0));
        }
      }
    },
    [handleAddDirectly],
  );

  return { handleAddDirectly, handleAdd, handleModalConfirm };
}
