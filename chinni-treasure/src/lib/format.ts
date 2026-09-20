/**
 * Shared money display formatting.
 *
 * One optioned formatter, `formatMoney`, covers every surface. Three wrappers
 * keep call sites short and their names stable:
 *
 *  - `formatMoney(value, opts?)` — always two decimals, no grouping.
 *    `bare` drops the ₹ symbol (table cells that render their own currency).
 *  - `formatRupees(value)` — "smart" decimals: integers render without a
 *    decimal part (`599`), non-integers with two (`599.50`), with Indian
 *    grouping. Call sites that add their own ₹.
 *  - `formatINR(value)` — always two decimals, with Indian grouping.
 *  - `formatShipping(value)` — money, `Free` for zero, or the em dash when
 *    shipping has not been computed (negative sentinel).
 *
 * All values are normalized (rounded to 2 decimals, floor at 0) before
 * display so floats do not drift across surfaces.
 */

function normalize(value: number): number {
  return Math.max(0, Math.round(value * 100) / 100);
}

/**
 * Format a rupee amount as `₹1234.56` (always two decimals, ungrouped).
 * Pass `{ bare: true }` for table cells that render their own currency label.
 */
export function formatMoney(value: number, options?: { bare?: boolean }): string {
  const formatted = normalize(value).toFixed(2);
  return options?.bare ? formatted : `₹${formatted}`;
}

/**
 * Format a rupee amount with smart decimals and Indian grouping.
 * Integers render as `1,234`, non-integers as `1,234.50`. No ₹ symbol —
 * call sites that use it add it themselves.
 */
export function formatRupees(value: number): string {
  const normalized = normalize(value);
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: Number.isInteger(normalized) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(normalized);
}

/**
 * Format a rupee amount as `1,234.56` (Indian grouping, always two decimals).
 * Call sites that add the ₹ symbol separately.
 */
export function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(normalize(value));
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
