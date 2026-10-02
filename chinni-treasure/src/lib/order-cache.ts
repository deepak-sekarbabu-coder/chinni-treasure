import { createRedisCache } from "@/src/lib/redis-cache";
import { statsCache } from "@/src/lib/stats-cache";
import { prisma } from "@/src/lib/prisma";
import { Prisma } from "@prisma/client";
import { PUBLIC_TTL, publicCacheControl } from "@/src/lib/cache-control";
import { fieldIssue } from "@/src/lib/checkout-fields";
import type { OrderView } from "@/src/lib/order-view";
import {
  buildTrackCacheKey,
  formatOrderResults,
  queryOrdersByOrderId,
  queryOrdersByPhone,
} from "@/src/lib/order-read";

/**
 * The Order cache module.
 *
 * Owns the order-detail and tracking caches, plus invalidation. Stats are
 * order-derived, so they are cleared alongside order caches on any order
 * mutation (placement, status change, tracking update) to keep the dashboard
 * fresh.
 */
const orderDetailCache = createRedisCache(PUBLIC_TTL.orderDetail, "order");
export const trackingCache = createRedisCache(PUBLIC_TTL.tracking, "track");

/** The public `Cache-Control` for `/api/track`, derived from the TTL above. */
export const TRACK_CACHE_CONTROL = publicCacheControl(PUBLIC_TTL.tracking);

export type DetailedOrder = Prisma.OrderGetPayload<{
  include: { items: { include: { product: true } }; statusHistory: true };
}>;

/**
 * Read one order through the order-detail cache — the module's single order
 * detail pipeline. `getOrderDetailForAudience` and the SSR confirmation page
 * both call this, so invalidation (invalidateOrderCache(id) →
 * orderDetailCache.remove) reaches both with no extra wiring.
 */
export async function getOrderDetail(id: string): Promise<DetailedOrder | null> {
  const cached = (await orderDetailCache.get(id)) as DetailedOrder | null;
  if (cached) return cached;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } }, statusHistory: true },
  });
  if (!order) return null;
  await orderDetailCache.set(id, order);
  return order;
}

/** Tracking lookup: the projected orders, or the 400/404 the route maps. */
export type TrackResult = { error: string; status: number } | { orders: OrderView[] };

/** An unauthenticated order read: the order, or the 400/404 the route maps. */
export type OrderDetailResult =
  | { error: string; status: number }
  | { order: DetailedOrder };

/**
 * Read one order for an **unauthenticated** caller — the one audience rule for
 * "look at an Order without a session", shared with the tracking seam.
 *
 * The route used to answer a bare UUID from the edge, which made a
 * shared CDN entry and a PII disclosure for anyone holding a link. An
 * unauthenticated read now needs the same second factor tracking does
 * (id **and** the order's phone), and a mismatch answers 404 rather than 403
 * so the endpoint cannot be used to probe which ids exist. The response is
 * `private, no-store` (see the route): a phone-keyed PII body has no business
 * in a shared cache.
 *
 * The admin/session surfaces are unaffected — they read `getOrderDetail`.
 */
export async function getOrderDetailForAudience(
  id: string,
  phone: string | null,
): Promise<OrderDetailResult> {
  const cleanPhone = (phone ?? "").replace(/\D/g, "");
  if (!cleanPhone) return { error: "Provide a phone parameter", status: 400 };
  const issue = fieldIssue("customerPhone", cleanPhone);
  if (issue) return { error: issue, status: 400 };

  const order = await getOrderDetail(id);
  // 404 for both "no such order" and "not your order" — one answer either way.
  if (!order || order.customerPhone.replace(/\D/g, "") !== cleanPhone) {
    return { error: "Order not found", status: 404 };
  }
  return { order };
}

/**
 * Read orders through the tracking cache — the module's tracking surface.
 * `/api/track` only rate-limits, parses and envelopes; the cache key, the
 * hit/miss branch and the lookup's own 400 live here with the cache they name.
 */
export async function getTrackedOrders(
  orderId: string | null,
  phone: string | null,
): Promise<TrackResult> {
  const cacheKey = buildTrackCacheKey(orderId, phone);
  if (!cacheKey) return { error: "Provide orderId or phone parameter", status: 400 };

  const cached = (await trackingCache.get(cacheKey)) as OrderView[] | null;
  if (cached) return { orders: cached };

  const result = orderId ? await queryOrdersByOrderId(orderId) : await queryOrdersByPhone(phone!);
  if ("error" in result) return result;

  const orders = formatOrderResults(result.orders);
  await trackingCache.set(cacheKey, orders);
  return { orders };
}

/**
 * Clear order caches (the specific order detail key, all tracking keys) and
 * the order-derived stats cache. Call after any order mutation.
 */
export async function invalidateOrderCache(orderId?: string): Promise<void> {
  if (orderId) await orderDetailCache.remove(orderId);
  await trackingCache.clear();
  // Stats derive from orders — keep the dashboard fresh after status changes.
  await statsCache.clear();
}
