import { z } from "zod";
import type { CartItem } from "@/src/types";
import type { PricedLine } from "@/src/lib/pricing";
import type { CreateOrderRequest } from "@/src/lib/api/schemas";

/**
 * Cart projections module — the one home for what a cart *becomes* when it
 * crosses a boundary, and therefore the one home for the rule that decides
 * which lines carry money.
 *
 * Three boundaries, three encoders, one private rule:
 *
 *  - cookie wire  → `cartItemsToWire` (server read, SSR hydration, client write)
 *  - money        → `cartPricedLines` (checkout preview, cart subtotal)
 *  - order intake → `cartOrderItems`  (`POST /api/orders` payload)
 *
 * The rule: the surprise gift (`isGift`) is not revenue-bearing and never
 * crosses a boundary; a gift box belongs to its parent line and expands wherever
 * the boundary needs it. It is deliberately **not exported** — callers choose an
 * encoder, they don't re-derive a policy.
 *
 * Two input shapes on purpose: the wire boundary needs no prices, so
 * `WireCartLine` stays price-free; the money and intake boundaries need `price`
 * (and parents need `sku` for the `0000` test-product shipping rule), so they
 * take `BillableCartLine`. A single widened shape would make the wire contract
 * appear to depend on fields it never reads.
 */

/** The cart cookie name — one definition for both sides of the boundary. */
export const CART_COOKIE = "cart";

/** Cookie lifetime in seconds (30 days). */
export const CART_MAX_AGE = 2592000;

const giftBoxSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

const cartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  giftBoxes: z.array(giftBoxSchema).optional(),
});

/** The wire shape as the server parses it (cookie read, hydration). */
export const cartSchema = z.array(cartItemSchema);

/**
 * Structural line the cookie boundary projects — no prices needed, and the
 * provider's richer display line fits structurally.
 */
export interface WireCartLine {
  productId: string;
  quantity: number;
  isGift?: boolean;
  giftBoxes?: ReadonlyArray<{ productId: string; quantity: number }> | null;
}

/**
 * Parent line the money and intake boundaries project. Gift boxes are carried on
 * the parent, with the unit price the boundary needs.
 */
export interface BillableCartLine {
  productId: string;
  quantity: number;
  price: number;
  sku?: string;
  isGift?: boolean;
  giftBoxes?: ReadonlyArray<{ productId: string; price: number; quantity: number }> | null;
}

/** The one billable-lines rule: drop the surprise gift. */
function billableItems<T extends { isGift?: boolean }>(items: ReadonlyArray<T>): T[] {
  return items.filter((i) => !i.isGift);
}

/** Project display lines to the wire: surprise gifts stripped, gift boxes reduced to ids. */
export function cartItemsToWire(items: ReadonlyArray<WireCartLine>): CartItem[] {
  return billableItems(items).map((i) => ({
    productId: i.productId,
    quantity: i.quantity,
    giftBoxes: i.giftBoxes?.map((gb) => ({ productId: gb.productId, quantity: gb.quantity })),
  }));
}

/**
 * Project display lines to flat priced lines for `computePricing`: each parent
 * line, then that parent's gift-box lines. Parents carry `sku` (the pricing
 * module's test-product override needs it); gift-box lines do not.
 */
export function cartPricedLines(items: ReadonlyArray<BillableCartLine>): PricedLine[] {
  return billableItems(items).flatMap((i) => [
    { price: i.price, quantity: i.quantity, sku: i.sku },
    ...(i.giftBoxes?.map((gb) => ({ price: gb.price, quantity: gb.quantity })) ?? []),
  ]);
}

/** Project display lines to the order-intake payload — same selection, `id` keys. */
export function cartOrderItems(
  items: ReadonlyArray<BillableCartLine>,
): CreateOrderRequest["items"] {
  return billableItems(items).map((i) => ({
    id: i.productId,
    quantity: i.quantity,
    giftBoxes: i.giftBoxes?.map((gb) => ({ id: gb.productId, quantity: gb.quantity })),
  }));
}
