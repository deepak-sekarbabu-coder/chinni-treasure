"use client";

import { useEffect, useState } from "react";

/**
 * The gift-box selection module — the one home for the Gift Box picker's shape,
 * its read, and its cap rule.
 *
 * `GiftBoxModal` (a catalogue card's add) and `GiftBoxSelector` (the detail
 * page's inline picker) used to declare the same two shapes, hand-roll the same
 * unvalidated read of `/api/gift-boxes`, and each write its own step rule. They
 * have drifted: the selector caps box units at the parent quantity, the modal
 * does not cap (pinned by `GiftBoxModal.test.tsx` — a card add may carry several
 * boxes for one product). The cap is a *stated* input here rather than an
 * omission in one of the copies, so the two surfaces can differ on purpose and
 * not by accident.
 */

export interface GiftBox {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  stockQuantity: number;
}

export interface SelectedGiftBox {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

/**
 * The one read of the gift-box list. `active` defers it: the selector reads on
 * mount, the modal only once it opens. The response is trusted as-is, exactly
 * as both copies always did — the route returns `listGiftBoxes()` raw.
 */
export function useGiftBoxes(active: boolean) {
  const [giftBoxes, setGiftBoxes] = useState<GiftBox[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/gift-boxes");
        if (res.ok && !cancelled) setGiftBoxes(await res.json());
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [active]);

  return { giftBoxes, loading };
}

/** Box units chosen, which is what a cap applies to. */
export function selectedBoxCount(selected: readonly SelectedGiftBox[]): number {
  return selected.reduce((sum, s) => sum + s.quantity, 0);
}

/** Can another box unit be chosen without passing `cap`? */
export function canAddBoxes(selected: readonly SelectedGiftBox[], cap: number): boolean {
  return selectedBoxCount(selected) < cap;
}

/** Add or remove a box line, then re-apply `cap` over the whole selection. */
export function toggleBox(selected: readonly SelectedGiftBox[], box: GiftBox, cap: number): SelectedGiftBox[] {
  const existing = selected.find((s) => s.productId === box.id);
  const next = existing
    ? selected.filter((s) => s.productId !== box.id)
    : [...selected, { productId: box.id, name: box.name, price: box.price, image: box.imageUrl || "", quantity: 1 }];
  return capBoxes(next, cap);
}

/**
 * Step one box's quantity by `delta`, dropping the line at zero. The cap is
 * re-applied across the whole selection, so stepping one box down can never
 * leave the total over `cap` and stepping up can never push it past.
 */
// ponytail: linear rescans of a handful of lines. Fine while a selection is one
// product's boxes; a bulk "N boxes across M products" picker would want a counter.
export function stepBox(
  selected: readonly SelectedGiftBox[],
  productId: string,
  delta: number,
  cap: number,
): SelectedGiftBox[] {
  const next = selected
    .map((s) => {
      if (s.productId !== productId) return s;
      const quantity = s.quantity + delta;
      return quantity <= 0 ? null : { ...s, quantity };
    })
    .filter((s): s is SelectedGiftBox => s !== null);
  return capBoxes(next, cap);
}

/** Trim the selection down to `cap` units, newest line first. */
function capBoxes(selected: SelectedGiftBox[], cap: number): SelectedGiftBox[] {
  let remaining = cap;
  const kept: SelectedGiftBox[] = [];
  for (let i = selected.length - 1; i >= 0; i--) {
    const line = selected[i];
    const quantity = Math.min(line.quantity, remaining);
    if (quantity > 0) kept.unshift({ ...line, quantity });
    remaining -= quantity;
  }
  return kept;
}