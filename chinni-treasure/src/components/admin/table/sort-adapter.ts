import type { SortingState } from "@tanstack/react-table";

/**
 * One sort adapter for the admin tables.
 *
 * Every admin table stores its sort as a string key the API understands and
 * shows it in the header as a tanstack `SortingState`. The translation used to
 * be hand-written per table (two copies, two shapes); a table now declares
 * `column id → { asc, desc }` once and both directions are derived.
 */
export type ColumnSortSpec<K extends string> = Record<string, { asc: K; desc: K }>;

/**
 * String key → table state. `unsetKey` names the key that means "no column
 * sorted" (the catalogue's default `newest` is its unsorted baseline, so the
 * Date header shows no arrow).
 */
export function toSortingState<K extends string>(
  spec: ColumnSortSpec<K>,
  key: K,
  unsetKey?: K,
): SortingState {
  if (unsetKey !== undefined && key === unsetKey) return [];
  for (const [id, pair] of Object.entries(spec)) {
    if (pair.asc === key) return [{ id, desc: false }];
    if (pair.desc === key) return [{ id, desc: true }];
  }
  return [];
}

/** Table state → string key. An empty or unknown column falls back. */
export function fromSortingState<K extends string>(
  spec: ColumnSortSpec<K>,
  sorting: SortingState,
  fallback: K,
): K {
  const head = sorting[0];
  if (!head) return fallback;
  const pair = spec[head.id];
  return pair ? (head.desc ? pair.desc : pair.asc) : fallback;
}
