/**
 * Shared money display formatting.
 *
 * Two conventions exist in the codebase and both are preserved here:
 *
 *  - `formatRupees` — "smart" decimals: integers render without a decimal
 *    part (`₹599`), non-integers render with two (`₹599.50`).
 *  - `formatINR` — always two decimals (`1,234.56`).
 *  - `formatMoney` — always two decimals with the ₹ symbol, ungrouped
 *    (`₹1234.56`); the shared rendering for order/cart/product surfaces.
 *  - `formatShipping` — money or `Free`/em dash for a shipping-cost row.
 *
 * All values are normalized (rounded to 2 decimals, floor at 0) before
 * display so floats do not drift across surfaces.
 */

function enIN(minimumFractionDigits: number) {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits,
    maximumFractionDigits: 2,
  });
}

/**
 * Format a rupee amount as `₹1,234.56` (en-IN locale, smart decimals).
 * Integers render as `₹1,234`. Negative values are normalized to 0.
 */
export function formatRupees(value: number): string {
  const normalized = Math.max(0, Math.round(value * 100) / 100);
  return enIN(Number.isInteger(normalized) ? 0 : 2).format(normalized);
}

/**
 * Format a rupee amount as `1,234.56` (en-IN locale, always two decimals).
 * Useful in places that add the ₹ symbol separately.
 */
export function formatINR(value: number): string {
  const normalized = Math.max(0, Math.round(value * 100) / 100);
  return enIN(2).format(normalized);
}

/**
 * Format a rupee amount as `₹1234.56` (always two decimals, ungrouped —
 * matches the inline `₹X.toFixed(2)` convention). Normalized to 0 floor, so
 * every surface renders money identically.
 */
export function formatMoney(value: number): string {
  const normalized = Math.max(0, Math.round(value * 100) / 100);
  return `₹${normalized.toFixed(2)}`;
}

/**
 * Format a shipping cost for display: `Free` when the cost is zero, the em
 * dash when shipping has not been computed (negative sentinel), otherwise
 * `₹X.XX`.
 */
export function formatShipping(value: number): string {
  if (value < 0) return "\u2014";
  if (value === 0) return "Free";
  return formatMoney(value);
}