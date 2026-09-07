/**
 * Checkout field rules — the one contract for order/customer field validation.
 *
 * This module owns every per-field rule for the checkout: required-ness,
 * email shape, the 10-digit phone, the 6-digit PIN, the 2-letter Indian
 * state code, and their user-facing messages. It is consumed by all three
 * surfaces that used to re-implement the rules:
 *
 *  - the server-side Order intake (`CreateOrderSchema` in order-intake.ts),
 *  - the client API schema (`CreateOrderInputSchema` in src/lib/api/schemas.ts),
 *  - the checkout page's per-step field errors (app/order/page.tsx).
 *
 * Before this module the three copies had already drifted (the page said
 * "Enter a valid 6-digit PIN code" while the server said "Postal code must
 * be 6 digits"); a rule added to one copy silently missed the others. Now a
 * rule changes once and every surface — form errors and server toasts alike
 * — says the same thing, by construction.
 *
 * Client-safe: imports only Zod and `constants.ts`. Messages are written for
 * the customer (the words the UI labels use: "Full name", "PIN code"), since
 * both the inline form errors and the server 400 toasts render them.
 */

import { z } from "zod";
import { INDIAN_STATES } from "@/src/lib/constants";

/** Full name — non-blank. */
export const CustomerNameSchema = z.string().trim().min(1, "Full name is required");

/** Email — non-blank, valid shape. */
export const EmailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Invalid email address");

/** Indian phone — exactly 10 digits. */
export const PhoneSchema = z
  .string()
  .trim()
  .min(1, "Phone is required")
  .regex(/^\d{10}$/, "Phone must be exactly 10 digits");

/** Address line 1 — non-blank. */
export const AddressLine1Schema = z.string().trim().min(1, "Address is required");

/** City — non-blank. */
export const CitySchema = z.string().trim().min(1, "City is required");

/** Indian state/UT — a 2-letter code from the INDIAN_STATES list. */
export const StateCodeSchema = z
  .string()
  .trim()
  .min(1, "State/UT is required")
  .length(2, "State code must be 2 characters")
  .refine((code) => INDIAN_STATES.some((s) => s.code === code), "Invalid state code");

/** PIN code — exactly 6 digits. */
export const PostalCodeSchema = z
  .string()
  .trim()
  .min(1, "PIN code is required")
  .regex(/^\d{6}$/, "PIN code must be 6 digits");

/**
 * The checkout field contract, keyed by the order-payload field names.
 * Consumers spread these into their object schemas or validate one field
 * at a time via `fieldIssue`.
 */
export const CheckoutFields = {
  customerName: CustomerNameSchema,
  customerEmail: EmailSchema,
  customerPhone: PhoneSchema,
  addressLine1: AddressLine1Schema,
  city: CitySchema,
  stateCode: StateCodeSchema,
  postalCode: PostalCodeSchema,
} as const;

export type CheckoutFieldKey = keyof typeof CheckoutFields;

/**
 * Validate a single field value against the shared contract and return the
 * first issue message, or undefined when the value is valid. This is what
 * the checkout page's per-field error spans render.
 */
export function fieldIssue(key: CheckoutFieldKey, value: string): string | undefined {
  const result = CheckoutFields[key].safeParse(value);
  return result.success ? undefined : result.error.issues[0]?.message;
}
