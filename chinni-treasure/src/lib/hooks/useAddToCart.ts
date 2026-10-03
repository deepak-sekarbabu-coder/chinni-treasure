"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useCart } from "@/src/components/cart/CartProvider";
import { useToast } from "@/src/components/ui/ToastProvider";
import { launchCartFlight } from "@/src/lib/cart-flight";
import type { GiftBoxModalProduct, SelectedGiftBox } from "@/src/components/pages/GiftBoxModal";
import type { CatalogueProduct } from "@/src/lib/api/schemas";
import { canBundleGiftBoxes } from "@/src/lib/gift-box";

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
export function useAddToCart(options: {
  triggerShippingNudge: (newTotal: number) => void;
}) {
  const { triggerShippingNudge } = options;
  const { addItem } = useCart();
  const { showToast } = useToast();
  const [giftBoxProduct, setGiftBoxProduct] = useState<GiftBoxModalProduct | null>(null);
  // Where the flight should launch from once a gift-box decision comes back.
  // Held in a ref, not state: it is read by the confirm/skip callbacks during
  // the same render cycle the modal closes in, and re-rendering to carry a
  // pointer to the old button would be a wasted frame.
  const flightOriginRef = useRef<HTMLElement | null>(null);

  const handleAddDirectly = useCallback(
    (p: CatalogueProduct, giftBoxes?: GiftBoxItem[], pressedFrom?: HTMLElement | null) => {
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
      // The one authored moment: the product's image leaves the card and
      // arrives at the cart, because this gesture's cause and effect sit in
      // different places. Fired here rather than at the button so every add
      // path — card, gift-box modal, quick actions — gets the same
      // acknowledgement, and fired only on a real add so a refused one (max
      // quantity, out of stock) never flies an item that did not land.
      launchCartFlight(p.imageUrl ?? "", pressedFrom ?? null);

      triggerShippingNudge(newTotal);
      showToast(`${p.name} added to cart`, "success");
    },
    [addItem, showToast, triggerShippingNudge],
  );

  const handleAdd = useCallback(
    (p: CatalogueProduct, pressedFrom?: HTMLElement | null) => {
      flightOriginRef.current = pressedFrom ?? null;
      if (canBundleGiftBoxes(p)) {
        setGiftBoxProduct({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          image: p.imageUrl ?? "",
          category: p.category,
        });
        return;
      }
      handleAddDirectly(p, undefined, pressedFrom);
    },
    [handleAddDirectly],
  );

  const handleModalConfirm = useCallback(
    (
      modalProduct: { id: string; name: string; price: number; image: string } | null,
      giftBoxes: GiftBoxItem[],
      pressedFrom?: HTMLElement | null,
    ) => {
      if (modalProduct) {
        const { image, ...product } = modalProduct;
        handleAddDirectly(
          {
            ...product,
            imageUrl: image,
            stockQuantity: 1,
            description: null,
            badge: null,
            sku: null,
            category: null,
          },
          giftBoxes.length > 0 ? giftBoxes : undefined,
          pressedFrom,
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
        handleModalConfirm(giftBoxProduct, giftBoxes, flightOriginRef.current);
        close();
      },
      // Skip is confirm-with-no-boxes; `handleModalConfirm` passes the empty
      // list as `undefined`, which is exactly what the old skip path sent.
      onSkip: () => {
        handleModalConfirm(giftBoxProduct, [], flightOriginRef.current);
        close();
      },
      onClose: close,
    };
  }, [giftBoxProduct, handleModalConfirm]);

  return { handleAdd, giftBox };
}
