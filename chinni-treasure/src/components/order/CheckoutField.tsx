"use client";

import type { ReactNode } from "react";

/**
 * The checkout field contract: the input's `id`, the error element's id, the
 * `aria-invalid` / `aria-describedby` pair and the error class are ONE
 * decision made from the field name. The nine checkout fields used to restate
 * that decision inline, with the id and the `-error` id written out by hand
 * twice each and nothing checking that the two halves agreed.
 */
export function fieldA11y(id: string, error?: string) {
  return {
    id,
    className: error ? "error" : "",
    "aria-invalid": !!error,
    "aria-describedby": error ? `${id}-error` : undefined,
  } as const;
}

/** The error span for a field — renders nothing when the field is valid. */
export function CheckoutError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <span id={`${id}-error`} className="form-error visible">
      {error}
    </span>
  );
}

/** The non-error hint under a field, e.g. "6-digit delivery PIN code". */
export function CheckoutHint({ children }: { children: ReactNode }) {
  return <span className="form-hint">{children}</span>;
}
