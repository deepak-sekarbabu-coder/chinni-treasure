import { NextResponse } from "next/server";
import type { z } from "zod";

type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse };

/**
 * Validate `input` against a Zod schema.
 *
 * Returns the parsed data, or a 400 response whose `error` field joins every
 * issue message. This is the one contract every API route used to re-print:
 *
 *   const parsed = Schema.safeParse(body);
 *   if (!parsed.success) {
 *     return NextResponse.json(
 *       { error: parsed.error.issues.map((i) => i.message).join(", ") },
 *       { status: 400 },
 *     );
 *   }
 *
 * Routes now write:
 *
 *   const parsed = validateOr400(Schema, body);
 *   if (!parsed.ok) return parsed.response;
 */
export function validateOr400<T>(schema: z.ZodType<T>, input: unknown): ValidationResult<T> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 },
      ),
    };
  }
  return { ok: true, data: parsed.data };
}
