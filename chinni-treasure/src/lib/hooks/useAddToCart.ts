"use client";

import { useCallback, useMemo, useState } from "react";
import { useCart } from "@/src/components/cart/CartProvider";
import { useToast } from "@/src/components/ui/ToastProvider";
import type { GiftBoxModalProduct, SelectedGiftBox } from "@/src/components/pages/GiftBoxModal";

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

/** A gift-box line the customer picked in the modal. */
type GiftBoxItem = SelectedGiftBox;

/**
 * The add-to-cart seam, gift-box flow included.
 *
 * Owns the whole "add this product" lifecycle: eligible products open the
 * gift-box modal instead of adding straight away, and the modal's
 * confirm / skip / close resolve back into the same add. Callers get two
 * things — `handleAdd` for the card's Add button, and `giftBox`, the modal
 * props bundle a page spreads into `<GiftBoxModal {...giftBox} />` (or renders
 * as `null`). No page keeps modal state, and the two page modules cannot
 * drift apart.
 *
 * The Cart module owns the post-add total: addItem returns it computed from
 * the fresh state, so callers never re-derive "total after this add" and the
 * stale-cart-read bug class (the ₹0 shipping-nudge popup) is structurally
 * impossible here.
 */
export function useAddToCart<T extends AddableProduct>(options: {
  triggerShippingNudge: (newTotal: number) => void;
}) {
  const { triggerShippingNudge } = options;
  const { addItem } = useCart();
  const { showToast } = useToast();
  const [giftBoxProduct, setGiftBoxProduct] = useState<GiftBoxModalProduct | null>(null);

  const handleAddDirectly = useCallback(
    (p: T, giftBoxes?: GiftBoxItem[]) => {
      if (p.stockQuantity <= 0) {
        showToast(`${p.name} is out of stock`, "error");
        return;
      }
      const { result: addResult, newTotal } = addItem({
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
      triggerShippingNudge(newTotal);
      showToast(`${p.name} added to cart`, "success");
    },
    [addItem, showToast, triggerShippingNudge],
  );

  const handleAdd = useCallback(
    (p: T) => {
      if (p.allowGiftBoxBundling && p.category?.name !== "Gift Boxes") {
        setGiftBoxProduct({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          image: p.imageUrl ?? "",
          category: p.category,
        });
        return;
      }
      handleAddDirectly(p);
    },
    [handleAddDirectly],
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
      }
    },
    [handleAddDirectly],
  );

  // Ready-made modal props, or null. Memoised so the callbacks stay stable
  // across renders (GiftBoxModal rebinds its Escape listener on `onClose`).
  const giftBox = useMemo(() => {
    if (!giftBoxProduct) return null;
    const close = () => setGiftBoxProduct(null);
    return {
      open: true,
      product: giftBoxProduct,
      onConfirm: (giftBoxes: GiftBoxItem[]) => {
        handleModalConfirm(giftBoxProduct, giftBoxes);
        close();
      },
      // Skip is confirm-with-no-boxes; `handleModalConfirm` passes the empty
      // list as `undefined`, which is exactly what the old skip path sent.
      onSkip: () => {
        handleModalConfirm(giftBoxProduct, []);
        close();
      },
      onClose: close,
    };
  }, [giftBoxProduct, handleModalConfirm]);

  return { handleAdd, giftBox };
}
