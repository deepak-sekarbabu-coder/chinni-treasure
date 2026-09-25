import { z } from "zod";
import type { CartItem } from "@/src/types";

/**
 * The Cart wire projection — the one shape a cart crosses the boundary with
 * (server cookie read, SSR hydration, client cookie write). Both the server
 * read module (cart-cookie.ts) and the client write side (CartProvider) import
 * from here, so a wire change needs one edit, not two coordinated ones.
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

/** Structural display line the write side projects (the provider's richer line fits). */
export interface WireCartLine {
  productId: string;
  quantity: number;
  isGift?: boolean;
  giftBoxes?: ReadonlyArray<{ productId: string; quantity: number }> | null;
}

/** Project display lines to the wire: surprise gifts stripped, gift boxes reduced to ids. */
export function cartItemsToWire(items: ReadonlyArray<WireCartLine>): CartItem[] {
  return items
    .filter((i) => !i.isGift)
    .map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      giftBoxes: i.giftBoxes?.map((gb) => ({ productId: gb.productId, quantity: gb.quantity })),
    }));
}