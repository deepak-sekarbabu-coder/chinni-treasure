/**
 * Pricing module — the single source of money computation for orders.
 *
 * `computePricing` takes flat priced lines and a state code and returns
 * the subtotal, shipping cost, and total amount. Used by both the
 * checkout preview (client) and the server-side order finalize.
 *
 * The shipping policy lives behind this seam:
 *  - ₹599 free-shipping threshold
 *  - ₹150 within Tamil Nadu, ₹200 elsewhere
 *  - Products with SKU "0000" (test products) ship free
 *
 * Gift-box bundling rules live with the Order intake, not here.
 */

const TAMIL_NADU_STATE_CODE = "TN" as const;

/** Free-shipping threshold in rupees. */
export const FREE_SHIPPING_THRESHOLD = 599;

const SHIPPING_CHARGES = {
  WITHIN_TAMIL_NADU: 150,
  OUTSIDE_TAMIL_NADU: 200,
} as const;

/**
 * A single priced line item fed to `computePricing`.
 * Callers flatten parents + gift boxes into this shape before calling.
 */
export interface PricedLine {
  /** Unit price in rupees (one item, not a total). */
  price: number;
  /** Quantity of this line item. */
  quantity: number;
  /** Optional SKU — present when the caller can identify test products. */
  sku?: string;
}

/**
 * The three monetary values every order stores and the checkout preview displays.
 */
export interface PricingResult {
  /** Sum of (price × quantity) across all lines. Includes gift-box revenue. */
  subtotal: number;
  /** Shipping charge after applying the threshold, state, and test-product rules. */
  shippingCost: number;
  /** subtotal + shippingCost. */
  totalAmount: number;
}

/**
 * Compute the subtotal, shipping, and total for a set of priced lines.
 *
 * The subtotal is `Σ(price × quantity)` — parents and gift-box lines are
 * both revenue-bearing and both counted. Historical order records that
 * excluded gift-box revenue from the subtotal are not affected; this
 * function applies only to new orders (see ADR-0002).
 */
export function computePricing(lines: PricedLine[], stateCode: string): PricingResult {
  const subtotal = lines.reduce(
    (sum, line) => sum + line.price * line.quantity,
    0,
  );

  const hasTestProduct = lines.some((line) => line.sku === "0000");
  const shippingCost = hasTestProduct
    ? 0
    : subtotal >= FREE_SHIPPING_THRESHOLD
      ? 0
      : stateCode === TAMIL_NADU_STATE_CODE
        ? SHIPPING_CHARGES.WITHIN_TAMIL_NADU
        : SHIPPING_CHARGES.OUTSIDE_TAMIL_NADU;

  return {
    subtotal,
    shippingCost,
    totalAmount: subtotal + shippingCost,
  };
}
