import { cookies } from "next/headers";
import { prisma } from "@/src/lib/prisma";
import type { CartItem } from "@/src/types";
import type { CartGiftBox, CartItemDisplay } from "@/src/components/cart/CartProvider";
import { cartSchema, CART_COOKIE } from "@/src/lib/cart-wire";

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

/**
 * The SSR hydration adapter for the cart seam. Reads the client-written cart
 * cookie and joins product rows so the cart badge and drawer paint with real
 * contents on the first HTML frame. Empty cookie is a zero-query fast path.
 */
export async function hydrateInitialCartItems(): Promise<CartItemDisplay[]> {
  const cookieItems = await getCartFromCookies();
  if (cookieItems.length === 0) return [];

  const productIds = new Set<string>();
  for (const item of cookieItems) {
    productIds.add(item.productId);
    for (const box of item.giftBoxes ?? []) productIds.add(box.productId);
  }

  const products = await prisma.product.findMany({
    where: { id: { in: Array.from(productIds) }, isActive: true },
    select: { id: true, name: true, price: true, imageUrl: true, stockQuantity: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  return cookieItems.flatMap((ci) => {
    const parent = productMap.get(ci.productId);
    if (!parent) return [];

    const giftBoxes: CartGiftBox[] = (ci.giftBoxes ?? []).flatMap((gb) => {
      const box = productMap.get(gb.productId);
      if (!box) return [];
      return [
        {
          productId: gb.productId,
          name: box.name,
          price: Number(box.price),
          image: box.imageUrl ?? "",
          quantity: gb.quantity,
        },
      ];
    });

    return [
      {
        productId: ci.productId,
        name: parent.name,
        price: Number(parent.price),
        quantity: ci.quantity,
        image: parent.imageUrl ?? "",
        stock: parent.stockQuantity,
        ...(giftBoxes.length > 0 && { giftBoxes }),
      },
    ];
  });
}
