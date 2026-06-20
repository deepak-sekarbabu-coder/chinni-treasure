---
name: zod-api-validation
description: "Add Zod validation to a Next.js API route: define schema, validate request body/params, return structured 400 errors. Use when creating or hardening API endpoints in this project."
---

# Zod API Validation

Add runtime input validation to Next.js API route handlers using Zod schemas.

## When to use

- Creating a new API route that accepts request body or query params
- Hardening an existing route that lacks input validation
- The project already centralizes response schemas in `src/lib/api/schemas.ts`

## Procedure

### 1. Define or reuse a Zod schema

Check `src/lib/api/schemas.ts` for an existing input schema (e.g., `CreateOrderInputSchema`, `ProductInputSchema`, `UpdateOrderStatusInputSchema`). If one exists and fits, import it. Otherwise, define a new one:

```ts
// In the route file, or in src/lib/api/schemas.ts for reuse
const MyInputSchema = z.object({
  field: z.string().min(1, "Field is required"),
  quantity: z.number().int().positive("Must be positive"),
  email: z.string().email("Invalid email"),
  phone: z.string().regex(/^\d{10}$/, "Phone must be exactly 10 digits"),
  postalCode: z.string().regex(/^\d{6}$/, "Postal code must be 6 digits"),
  stateCode: z.string().length(2, "State code must be 2 characters"),
});
```

**Field patterns used in this project:**
- Names/strings: `z.string().min(1, "... is required")`
- Emails: `z.string().email("Invalid email")`
- Phone (Indian): `z.string().regex(/^\d{10}$/, "Phone must be exactly 10 digits")`
- PIN/Postal: `z.string().regex(/^\d{6}$/, "Postal code must be 6 digits")`
- State code: `z.string().length(2)` with `.refine()` against `INDIAN_STATES`
- Prices: `z.coerce.number().positive("Price must be positive")`
- Quantities: `z.number().int().positive("Must be positive integer")`
- IDs: `z.string().min(1, "ID is required")`
- Enums: `z.enum([...])` or `z.union([...])`
- Optional fields: `.optional()` or `.nullable().optional()`
- Arrays: `z.array(ItemSchema).min(1, "At least one item required")`

### 2. Validate in the route handler

Use `safeParse()` for non-throwing validation:

```ts
export async function POST(request: Request) {
  // CSRF check first (for state-changing methods)
  const csrfError = validateCsrfOrigin(request);
  if (csrfError) return csrfError;

  try {
    const body = await request.json();
    const parsed = MyInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 },
      );
    }
    // Use parsed.data (type-safe) instead of raw body
    const { field, quantity } = parsed.data;
    // ... business logic
  } catch (error) {
    console.error("Failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
```

### 3. Validate query params (for GET routes)

```ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10")));
  const status = searchParams.get("status");

  // Optional: validate status against enum
  if (status && !OrderStatusSchema.safeParse(status).success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  // ... query logic
}
```

### 4. If adding a new schema to shared file

Add both the schema and its inferred type to `src/lib/api/schemas.ts`:

```ts
export const MyInputSchema = z.object({ ... });
export type MyInput = z.infer<typeof MyInputSchema>;
```

### 5. Validate response (optional, for API client)

For routes consumed by the centralized API client (`src/lib/api/client.ts`), add a response schema:

```ts
export const MyResponseSchema = z.object({ ... });
export type MyResponse = z.infer<typeof MyResponseSchema>;
```

## Key conventions in this project

- **Error format**: `{ error: string }` — join multiple issue messages with `", "`
- **CSRF**: Always call `validateCsrfOrigin(request)` before body parsing on POST/PUT/PATCH/DELETE
- **Sanitization**: Apply `sanitize()` from `@/src/lib/sanitize` to user-supplied strings before DB writes
- **Auth**: Call `checkAuth()` for admin-only routes; return 401 if null
- **Transaction**: Use `prisma.$transaction()` with `Serializable` isolation for order creation (stock deduction)
- **Concurrency**: Check `version` field for optimistic locking on status updates; return 409 on conflict

## Stopping condition

Route has a Zod schema, uses `safeParse()`, returns structured 400 on validation failure, and uses `parsed.data` (not raw body) for business logic.
