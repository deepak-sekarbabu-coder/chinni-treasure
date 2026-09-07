# ADR-0002: Pricing basis — gift-box prices included in order totals

- **Status:** Accepted — implemented, and the paid==stored enforcement follow-up is closed (2026-09-06)
- **Date:** 2026-09-05
- **Related:** `CONTEXT.md` → *Pricing* (domain concept), *Pricing module — seam*, *Order intake module — seam*; ADR-0001 (cache ownership)

## Context

Gift-box line items carry unit prices that customers pay, but the server-side order placement excluded gift-box prices from `subtotal` and `totalAmount` (`app/api/orders/route.ts:224`). The checkout preview, however, included gift-box prices in the total fed to Razorpay (`app/order/page.tsx:380–387`). Two concrete consequences:

1. **Shipping threshold divergence:** the free-shipping threshold (₹599) was evaluated on the server-side parents-only subtotal but on the client-side gift-box-inclusive total, so the same cart could show free shipping to the customer and a shipping charge on the order record.
2. **Paid ≠ stored:** the Razorpay charge included gift-box revenue; the order record did not — making exact reconciliation impossible and leaving confirmation/PDF totals inconsistent with line items.

## Decision

Subtotal and totalAmount on the `Order` record include **all revenue-bearing line items** — parent products and gift-box products. The pricing basis going forward is:

> `subtotal = Σ(line.price × line.quantity)` for all parent lines + gift-box lines.
> `shippingCost` is computed on that subtotal.
> `totalAmount = subtotal + shippingCost`.

This ensures paid == stored for every new order. The exact paid-to-stored comparison (integer-paise, Razorpay-amount-to-`totalAmount`) is owned by the **Order intake seam** (review candidate 1); the Pricing module carries rupee floats as today.

### Enforcement (closed 2026-09-06)

The paid==stored invariant is now **enforced server-side** at the Order intake seam, not merely assigned to it:

1. `POST /api/orders` accepts `paymentGateway` (default `razorpay`) and `razorpayOrderId`. For razorpay placements it resolves the **authoritative charged amount** from Razorpay's own records via `fetchRazorpayPayment` (`src/lib/razorpay-server.ts`) — a client-claimed amount is never trusted — and verifies the payment belongs to the given Razorpay order and is `captured`/`authorized`.
2. Inside the placement transaction, `placeOrder` calls `assertPaidAmountMatchesTotal(resolvedPaidPaise, totalAmount)` (integer paise on both sides) **before** the order is created. A mismatch aborts the order entirely — nothing is stored, no stock is deducted.
3. Manual bank-transfer placements (`paymentGateway: "manual"`) skip the gateway check: there is no gateway record to compare against. Their reference is stored as `transactionId` and reconciliation remains an admin concern.

This also closes the integer-paise follow-up named under Consequences: the comparison is integer-paise on both sides (`Math.round(rupees × 100)`), while the Pricing module continues to carry rupee floats. Regression coverage lives in `src/lib/__tests__/order-intake.test.ts` (module interface) and `src/__tests__/api/orders.test.ts` (adapter: mismatch, wrong Razorpay order, failed payment, manual bypass).

### Scope and exclusions

- **Historical orders** retain their stored `subtotal`/`totalAmount` (no backfill). The new basis applies only to orders placed after this ADR is accepted.
- **Bundling rules** (`giftBox.quantity ≤ parent.quantity`, category checks) remain with the Order intake, not the Pricing module.
- **Surprise-gift items** (`isGift`) are excluded from the order payload by the client and therefore never enter the Pricing module's line-item basis.
- **Display formatting** is a separate concern (`src/lib/format.ts`), not part of the Pricing module.

## Consequences

**Positive**

- **Locality:** the pricing basis is defined once, in `src/lib/pricing.ts`, and consumed by both the checkout preview and the server finalize. There is no longer a place where "subtotal" has a different meaning.
- **Correctness:** the free-shipping threshold and the Razorpay charge evaluate the same subtotal. No cart can be in a state where the preview and the order record disagree.
- **Leverage:** the pricing module is the natural home for future pricing changes (e.g. state-specific surcharges, coupon logic, tax) without touching two callers.

**Negative / trade-offs**

- **Historical totals are stale.** Existing orders' stored totals exclude gift-box revenue. This is acknowledged; the totals were accurate at the time they were computed, and the gap is visible only when comparing historical orders against the current basis. If exact historical reconciliation is ever needed, it is a backfill-script concern, not a real-time-invariant concern.
- **Rounding behaviour unchanged.** The module carries rupee floats. ~~Float rounding is deferred to the Order intake seam (integer-paise comparison).~~ **Closed 2026-09-06:** the integer-paise comparison is implemented in `assertPaidAmountMatchesTotal` and enforced before persistence (see *Enforcement* above).
- **Gateway lookup on placement.** Razorpay placements now make one additional server-to-server call (`payments.fetch`) before the order transaction. This adds latency and a gateway-availability dependency to order placement; a gateway outage fails placement with a 502-mapped error rather than storing an unverifiable order — the deliberate trade-off.
