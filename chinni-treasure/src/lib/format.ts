/**
 * Shared money display formatting.
 *
 * Two conventions exist in the codebase and both are preserved here:
 *
 *  - `formatRupees` — "smart" decimals: integers render without a decimal
 *    part (`₹599`), non-integers render with two (`₹599.50`).
 *  - `formatINR` — always two decimals (`1,234.56`).
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