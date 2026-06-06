import { cookies } from "next/headers";
import { z } from "zod";
import type { CartItem } from "@/src/types";

const cartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

const cartSchema = z.array(cartItemSchema);

const CART_COOKIE = "cart";

export async function getCartFromCookies(): Promise<CartItem[]> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(CART_COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    const result = cartSchema.safeParse(parsed);
    return result.success ? result.data : [];
  } catch {
    return [];
  }
}
