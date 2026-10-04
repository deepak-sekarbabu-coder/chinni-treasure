"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useCart } from "@/src/components/cart/CartProvider";
import { useToast } from "@/src/components/ui/ToastProvider";
import { launchCartFlight } from "@/src/lib/cart-flight";
import type { GiftBoxModalProduct } from "@/src/components/pages/GiftBoxModal";
import type { SelectedGiftBox } from "@/src/components/pages/gift-box-picker";
import type { CatalogueProduct } from "@/src/lib/api/schemas";
import { canBundleGiftBoxes } from "@/src/lib/gift-box";

/** A gift-box line the customer picked in the modal. */
type GiftBoxItem = SelectedGiftBox;

/**
 * What an add was asked to do beyond "add this product". The detail page
 * already collected a quantity and the customer's own box picks, so it passes
 * `giftBoxes` — and their presence means the gift-box decision is made, which
 * is what keeps that surface out of a second copy of this flow.
 */
export interface AddToCartOptions {
  giftBoxes?: GiftBoxItem[];
  pressedFrom?: HTMLElement | null;
  quantity?: number;
}

/** The one answer to a refused add; three surfaces used to word it differently. */
function refusalCopy(
  result: "max_reached" | "max_one" | "out_of_stock",
  p: CatalogueProduct,
): { message: string; tone: "info" | "error" } {
  if (result === "out_of_stock") return { message: `${p.name} is out of stock`, tone: "error" };
  if (result === "max_one") return { message: `Max 1 Qty per user for ${p.name}`, tone: "info" };
  return {
    message: `Maximum available quantity reached for ${p.name} (${p.stockQuantity})`,
    tone: "info",
  };
}

/**
 * The add-to-cart seam, gift-box flow included.
 *
 * Owns the whole "add this product" lifecycle: eligible products open the
 * gift-box modal instead of adding straight away, and the modal's
 * confirm / skip / close resolve back into the same add. Callers get two
 * things — `handleAdd` for the Add button, and `giftBox`, the modal
 * props bundle a page spreads into `<GiftBoxModal {...giftBox} />` (or renders
 * as `null`). No page keeps modal state, and no page keeps its own copy of the
 * add: the detail page passes a quantity and the customer's own box picks
 * through `AddToCartOptions`, so the classification, the toasts, the nudge and
 * the flight stay here for every surface.
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
    (
      p: CatalogueProduct,
      giftBoxes?: GiftBoxItem[],
      pressedFrom?: HTMLElement | null,
      quantity = 1,
    ) => {
      if (p.stockQuantity <= 0) {
        showToast(`${p.name} is out of stock`, "error");
        return;
      }
      let newTotal = 0;
      for (let i = 0; i < quantity; i++) {
        const { result: addResult, newTotal: totalAfterAdd } = addItem({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          image: p.imageUrl ?? "",
          stock: p.stockQuantity,
          sku: p.sku ?? undefined,
          // Boxes ride on the first unit only, so adding 3 of a product does
          // not add 3 sets of boxes.
          giftBoxes: i === 0 ? giftBoxes : undefined,
        });
        if (addResult !== "added") {
          const refusal = refusalCopy(addResult, p);
          showToast(refusal.message, refusal.tone);
          return;
        }
        newTotal = totalAfterAdd;
      }
      // The one authored moment: the product's image leaves the card and
      // arrives at the cart, because this gesture's cause and effect sit in
      // different places. Fired here rather than at the button so every add
      // path — card, gift-box modal, detail page — gets the same
      // acknowledgement, and fired only on a real add so a refused one (max
      // quantity, out of stock) never flies an item that did not land.
      launchCartFlight(p.imageUrl ?? "", pressedFrom ?? null);

      triggerShippingNudge(newTotal);
      showToast(
        quantity > 1 ? `${quantity} × ${p.name} added to cart` : `${p.name} added to cart`,
        "success",
      );
    },
    [addItem, showToast, triggerShippingNudge],
  );

  const handleAdd = useCallback(
    (p: CatalogueProduct, opts: AddToCartOptions = {}) => {
      flightOriginRef.current = opts.pressedFrom ?? null;
      // Boxes already chosen by the caller: the decision is made, so skip the
      // modal and add straight away.
      if (opts.giftBoxes) {
        handleAddDirectly(p, opts.giftBoxes, opts.pressedFrom, opts.quantity);
        return;
      }
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
      handleAddDirectly(p, undefined, opts.pressedFrom, opts.quantity);
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
