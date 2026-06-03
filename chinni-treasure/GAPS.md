# Chinni Treasure — Gaps Analysis

> Generated from codebase review of `chinni-treasure/` at `C:\Projects\website\chinni-treasure`

---

## 1. Critical Security Vulnerabilities

### 1.1 Dual JWT Libraries — Divergent Signing May Break Auth

**Files:** `package.json` (jsonwebtoken v9.0.3 + jose v6.2.3), `src/lib/auth.ts` (uses jsonwebtoken), `proxy.ts` (uses jose)

`src/lib/auth.ts` signs tokens with `jsonwebtoken` using a raw string secret, while `proxy.ts` verifies with `jose` using `TextEncoder.encode()`. If `JWT_SECRET` contains non-ASCII or special characters, the derived HMAC keys will differ, causing tokens signed by the API to be rejected by the middleware, or vice versa. This is a **production-breaking bug** that could manifest inconsistently.

**Fix:** Pick one library. Remove `jsonwebtoken` + `@types/jsonwebtoken`. Rewrite `src/lib/auth.ts` to use `jose` (which works in both Edge and Node.js runtimes).

### 1.2 Hardcoded Fallback JWT Secret

**Files:** `proxy.ts:6`, `src/lib/auth.ts:5`

```ts
process.env.JWT_SECRET || "dev-secret"
```

If `JWT_SECRET` is unset in production (misconfiguration), both systems silently fall back to `"dev-secret"`, allowing anyone to forge admin session tokens.

**Fix:** Throw on missing secret in production. Remove hardcoded fallback.

### 1.3 No Input Sanitization on Product Create/Update (XSS)

**Files:** `app/api/products/route.ts:38-58`, `app/api/products/[id]/route.ts:23-46`

Product `name` and `description` are stored and rendered **without sanitization**. The `sanitize()` utility exists (`src/lib/sanitize.ts`) but is never called on product fields. These values render in the catalogue page and admin dashboard — an admin could inject HTML/script tags.

**Fix:** Apply `sanitize()` to all text fields in product create/update endpoints.

### 1.4 Track API Phone Search Uses `contains` (Data Leak)

**File:** `app/api/track/route.ts:52-57`

```ts
where: { customerPhone: { contains: cleanPhone } },
```

Using `contains` (LIKE) for phone matching enables prefix/suffix brute-force probing. An attacker could enumerate partial phone numbers and leak customer order data.

**Fix:** Use exact match (`equals`) instead of `contains`. Validate input is exactly 10 digits.

### 1.5 Rate Limiter Is Per-Instance (Ineffective in Serverless)

**File:** `src/lib/rate-limiter.ts:1`

The rate limiter uses an in-memory `Map`. On Vercel or multi-instance deployments, each instance tracks independently, making the 5-attempt limit effectively 5 × N instances.

**Fix:** Use a shared store (Redis, DB) or document the limitation.

---

## 2. Missing / Incomplete Error Handling

### 2.1 Admin Dashboard — Silent Failures on All Fetches

**File:** `app/admin/page.tsx:179-183, 209-213, 224-228`

The catch blocks in `fetchStats()`, `fetchOrders()`, and `fetchProducts()` only `console.error`. Users see no toast, no error state, and no retry button. The dashboard appears broken with no feedback.

**Fix:** Show an error toast and a dedicated error UI with a Retry button on failure.

### 2.2 Admin Dashboard — No Response Handling for Status Update 409/400

**File:** `app/admin/page.tsx:249-263, 273-290, 298-313`

When `fetch('/api/orders/${orderId}/status', ...)` returns `!res.ok` (e.g., 409 version conflict), the catch block does not run. The user sees no feedback.

**Fix:** Read `res.json()` in the non-ok path and call `showToast(data.error, "error")`.

### 2.3 Admin Dashboard — `handleSaveProduct` Ignores API Errors

**File:** `app/admin/page.tsx:344-353`

If product creation/update returns 400 or 500, there is no `else` branch. The form stays open with no error message.

**Fix:** Add an `else` branch that displays the server error.

### 2.4 Checkout — Unhandled Non-JSON Response

**File:** `app/order/page.tsx:116-118`

If `res.json()` fails (e.g., 502 HTML response), an unhandled error is thrown.

**Fix:** Wrap `res.json()` in try-catch with a generic fallback message.

### 2.5 Admin Dashboard — Charts Section Hidden When Empty

**File:** `app/admin/page.tsx:463-486, 489`

Stats section only renders when `stats` is non-null. Charts section hides when `chartData` is empty. If there are no orders or stats fail to load, sections disappear silently.

**Fix:** Always show sections (with "No data" placeholder) even when empty or errored.

### 2.6 Orders API — `GET [id]` Bypasses Auth for Sensitive Data

**File:** `app/api/orders/[id]/route.ts:5-28`

The `GET /api/orders/[id]` endpoint has **no auth check** and no rate limiting. Anyone with a valid UUID can fetch any order's full details (name, address, phone, items, notes).

**Fix:** Add auth or a token-based access check for individual order lookup.

---

## 3. Type Safety Issues

### 3.1 All API Routes Use Unsafe `as` Casts on Request Bodies

**Files:** All route.ts files under `app/api/`

Every endpoint casts `request.json()` to `Record<string, unknown>` and extracts fields with `as string`. A malformed body with wrong types (e.g., `customerName: 123`) silently passes truthiness checks.

**Fix:** Use Zod schemas (already in dependencies) to validate request bodies. This would catch type mismatches at the boundary.

### 3.2 `checkAuth` Duplicated and Weakly Typed

**Files:** `app/api/orders/route.ts:8-12`, `app/api/orders/[id]/status/route.ts:5-9`, `app/api/products/route.ts:5-9`, `app/api/products/[id]/route.ts:5-9`, `app/api/stats/route.ts:21-25`

The same 5-line `checkAuth()` function is copy-pasted into every route file. The return type `as { id: string; username: string; role: string }` is unchecked — TypeScript trusts the cast even if the JWT payload changes.

**Fix:** Export a shared `checkAuth` from `src/lib/auth.ts` with a proper Zod-validated session schema.

### 3.3 Order Status Type Not Validated Server-Side

**File:** `app/api/orders/[id]/status/route.ts:24`

The `status` from the request body is passed directly to Prisma's `data.status` without validating it's a valid `OrderStatus` enum value. A non-enum string causes a Prisma runtime error.

**Fix:** Validate `status` against the `OrderStatus` enum values with Zod.

### 3.4 Product Price Can Produce NaN

**Files:** `app/api/products/route.ts:51`, `app/api/products/[id]/route.ts:33`

`parseFloat(price)` where `price` could be `null`, `undefined`, `"abc"`, or an object — all produce `NaN`.

**Fix:** Validate `price` is a positive finite number with Zod before parsing.

### 3.5 Track API — Response Casts Ignore Actual DB Types

**File:** `app/api/track/route.ts:60-85`

Every field is manually cast with `as string`, `as number`, etc. If the database schema changes (e.g., a column is renamed), there is zero type safety.

**Fix:** Use Prisma-generated types instead of manual casts.

---

## 4. SSR / CSR Hydration Mismatch Risks

### 4.1 Cart Loads from `localStorage` After Mount (Flash of Empty Cart)

**File:** `src/components/cart/CartProvider.tsx:52-65`

The cart starts as `[]` and hydrates asynchronously after mount. SSR always sees an empty cart. Any cart-dependent content flashes "empty" before the client-side state loads.

**Fix:** Use the server cart cookie (`src/lib/cart-cookie.ts`) to hydrate cart state server-side via a prop from `layout.tsx`.

### 4.2 Server Cart Cookie Exists but Is Never Used

**File:** `src/lib/cart-cookie.ts` (entire file — 40 lines of dead code)

AGENTS.md documents: "Server Cart Cookie enabling SSR cart hydration." The file defines `getCartFromCookies()`, `serializeCartCookie()`, and `getCartCookieOptions()` — but **nothing in the codebase calls these functions**. Not on order placement, not on page load, not in the layout.

**Fix:** Integrate the cart cookie into the order flow (serialize on add, read on SSR) or remove the unused code.

### 4.3 Track Page Is Fully Client-Side

**File:** `app/track/page.tsx`

The entire page is `"use client"` with no server component wrapper, missing SSR opportunity. No support for initial query params (e.g., `?orderId=...`).

**Fix:** Create a server component wrapper or accept initial params to SSR results.

---

## 5. Accessibility Issues

### 5.1 Modals Lack Focus Trapping and ARIA Attributes

**Files:** `app/admin/page.tsx:941-1020`, `app/track/page.tsx:284-286`

- No focus trapping — tab can escape behind the modal
- No `aria-modal`, `role="dialog"`, or `aria-labelledby`
- No Escape key handler on modal overlays
- Focus is not returned to the trigger element on close

### 5.2 Admin Dashboard Tabs Lack ARIA Roles

**File:** `app/admin/page.tsx:568-577`

Tab buttons lack `role="tablist"`, `role="tab"`, and `aria-selected` attributes.

### 5.3 Toasts Are Not Dismissible

**File:** `src/components/ui/ToastProvider.tsx:41-54`

Toasts have `aria-live="polite"` but no close button, no focusability, and no upper limit on visible count. Users cannot read them at their own pace.

### 5.4 Animations Ignore `prefers-reduced-motion`

**File:** `app/admin/page.tsx:477-479` (and likely other places)

`@media (prefers-reduced-motion: no-preference)` is not respected anywhere despite being required in AGENTS.md.

### 5.5 Admin Login Error Not Announced to Screen Readers

**File:** `app/admin/login/page.tsx:110-124`

When an error appears, focus is not moved to it. No `aria-live` region on the error container.

---

## 6. Performance Concerns

### 6.1 Stats API Fetches All Order Items for All Time

**File:** `app/api/stats/route.ts:71-73`

```ts
prisma.orderItem.findMany({ select: { productName, quantity, unitPrice } })
```

No date filter. As data grows, this becomes progressively slower and more memory-intensive. The 30s cache is a band-aid.

**Fix:** Add a date filter (last 12 months) or use SQL aggregation.

### 6.2 Admin Dashboard Fetches All Data on Every Page Load

**File:** `app/admin/page.tsx:158`

Stats, orders, and products are fetched simultaneously on every page load, even if the user only wants one tab.

**Fix:** Lazy-fetch data based on active tab.

### 6.3 Product Catalogue Has No Pagination

**File:** `app/catalogue-content.tsx:97-111`

All products render in a flat grid with no pagination, search, or filter. Breaks down with 100+ products.

**Fix:** Add pagination, search, and category filtering.

### 6.4 Non-Memoized Callbacks in Admin Dashboard

**File:** `app/admin/page.tsx:169-228`

Functions like `fetchStats`, `fetchOrders`, `handleProductSave`, etc. are recreated on every render.

**Fix:** Wrap with `useCallback` where passed as props.

---

## 7. Missing Features (Documented but Not Implemented)

### 7.1 Chart.js Installed but Unused

**File:** `package.json:25`

AGENTS.md says "Interactive Analytics powered by Chart.js." But `app/admin/page.tsx` renders **plain HTML tables** for chart data, not Chart.js visualizations.

**Fix:** Implement Chart.js charts or remove the dependency and update docs.

### 7.2 Excel Export Script Exists but Not Exposed

**File:** `scripts/export-to-excel.ts` (224 lines of dead code)

No UI button, no API route. The feature is invisible to users.

**Fix:** Add a download button in admin dashboard or remove.

### 7.3 Product Badge Not Displayed on Catalogue

**File:** `app/admin/page.tsx:90-97` (badge options exist) vs `app/catalogue-content.tsx` (no badge rendering)

Admin can set a `ProductBadge` (bestseller, new, premium, limited, luxury), but badges are never rendered on the client-facing catalogue page.

**Fix:** Verify `ProductCard` renders the badge and add visual badge UI.

---

## 8. Missing Validation & Sanitization

### 8.1 No Zod Validation on Order Request Body

**File:** `app/api/orders/route.ts:55-73`

Fields are extracted via unsafe casts with only truthiness checks. No schema validation for email format, phone digits, PIN code format, valid state code, item UUIDs, positive prices/quantities.

**Fix:** Define and use a Zod schema for order creation payload (Zod is already in dependencies).

### 8.2 No Input Length Limits on Track API

**File:** `app/api/track/route.ts:45-58`

`orderId` and `phone` have no length validation before being passed to database queries.

**Fix:** Validate max length and format before querying.

### 8.3 Product Update Endpoint Lacks Sanitization

**File:** `app/api/products/[id]/route.ts:23-46`

Same XSS vector as product creation — name and description are stored raw.

**Fix:** Apply `sanitize()` to `name` and `description` in both PUT and POST handlers.

---

## 9. Code Quality Issues

### 9.1 Duplicate `checkAuth` in Every Route File

5 files each define the same 5-line function. Violates DRY.

**Fix:** Export from `src/lib/auth.ts`.

### 9.2 Inline Styles Everywhere in Admin Dashboard

**File:** `app/admin/page.tsx` (all 1023 lines)

Nearly every element uses `style={...}` instead of CSS classes. This bloats bundle size, prevents caching, and makes responsive behavior harder.

**Fix:** Move styles to CSS classes in `globals.css`.

### 9.3 `editProduct` Hardcodes `categoryId` to `"1"`

**File:** `app/admin/page.tsx:417`

```ts
categoryId: product.category?.name ? "1" : "",
```

Editing a product always resets its category to the first one, regardless of its actual category.

**Fix:** Use `product.categoryId` instead of hardcoding (requires adding `categoryId` to the `Product` interface).

### 9.4 Race Condition in Optimistic Locking (TOCTOU)

**File:** `app/api/orders/[id]/status/route.ts:36-99`

The version is read in a separate query from the update. Between reading the version and updating, another request can modify the order. The `order.update` does not guard with `where: { version: expectedVersion }`.

**Fix:** Add `where: { id, version: expectedVersion }` to the `update` call and check affected row count. Same fix needed in the rejection transaction branch.

### 9.5 No Server-Side Validation of Status Transitions

**File:** `app/api/orders/[id]/status/route.ts:85-99`

`ORDER_STATUS_FLOW` exists in `src/lib/constants.ts` but is **never checked server-side**. An admin could skip from pending to shipped, reverse from delivered to packaging, or re-reject a rejected order.

**Fix:** Validate the transition against `ORDER_STATUS_FLOW` before applying.

### 9.6 Rejection Transaction Lacks Version Guard

**File:** `app/api/orders/[id]/status/route.ts:58-71`

The `order.update` inside the rejection transaction branch does not use `where: { id, version }`.

**Fix:** Add version guard to the rejection path's update.

### 9.7 `eslint-disable-next-line react-hooks/exhaustive-deps` Used Excessively

**File:** `app/admin/page.tsx:166, 265, 315`

Three hooks have the disable comment for dependency arrays. Hides bugs where stale closures could reference outdated state.

### 9.8 Rate Limiter Returns `remaining` But It's Never Sent to Client

**File:** `src/lib/rate-limiter.ts:6-18`, `app/api/auth/login/route.ts`

The `remaining` count is returned but never exposed via a response header like `X-RateLimit-Remaining`.

---

## 10. Duplicate / Unused Dependencies

| Dependency | Status | Why |
|---|---|---|
| `jsonwebtoken` + `@types/jsonwebtoken` | **Unnecessary** | `jose` already handles both middleware and API JWT needs |
| `chart.js` | **Unused** | Dashboard uses tables, not charts |
| `exceljs` | **Unused in production** | Script exists but no API/UI invokes it |
| `@types/pg` | **Unnecessary** | Prisma abstracts the `pg` driver |
| `swagger-ui-react` | **Large bundle, verify usage** | Check if `/docs` page is sufficiently accessed to justify it |

---

## 11. Missing Tests

### 11.1 Incomplete Test Setup Mocks

**File:** `src/test/setup.ts`

- `next/headers` mock's `cookies()` is synchronous but Next.js 16 returns a Promise
- No mock for `@prisma/client` — server logic tests cannot run without a database
- No mocks for `useToast` context
- `next/image` mock returns `null` without forwarding props

### 11.2 No Tests for Critical Business Logic

Based on the test directory structure, the project has **no tests** for:
- Cart operations (add, remove, update, stock limit enforcement)
- Checkout validation (Zod schemas, field validation rules)
- Order status transitions (valid/invalid flows)
- Optimistic locking (version conflict scenarios)
- Rate limiting logic
- Auth token verification
- Sanitization utility
- Product badge display logic

### 11.3 Missing Component Tests

No tests exist for key interaction patterns in:
- `ProductCard` — out-of-stock, low-stock, add-to-cart click
- `ToastProvider` — show, auto-dismiss, multiple toasts, max visible
- `CartProvider` — localStorage read/write, stock enforcement
- `OrderDetailModal` — action buttons, status timeline

---

## 12. Miscellaneous Issues

### 12.1 `sharp` in Dev Dependencies

**File:** `package.json:53`

`sharp` is listed as a `devDependency` but Next.js relies on it for production image optimization. It should be in `dependencies`.

### 12.2 No CORS Headers on Public API Routes

**Files:** `app/api/track/route.ts`, `app/api/orders/route.ts` (public POST)

No `Access-Control-Allow-Origin` headers. Requests from different origins could be blocked.

### 12.3 No CSRF Protection

All state-changing endpoints lack CSRF tokens. `SameSite=Lax` on the session cookie provides partial protection but is not sufficient for all scenarios.

### 12.4 Order Number Generation Could Collide

**File:** `src/lib/utils.ts` (`generateOrderNumber()`)

If the function does not handle uniqueness collisions (e.g., high concurrency), duplicate `orderNumber` values would cause Prisma errors (the field is `@unique`).

### 12.5 PostCSS Config Is Empty

**File:** `postcss.config.mjs`

An empty PostCSS config implies no plugins are configured. If no PostCSS plugins are needed, the file and `postcss.config.mjs` could be removed.

### 12.6 `.env` Contains Production Database Credentials

**File:** `.env`

The `.env` file — which is likely committed to git — contains a real Neon PostgreSQL connection string with an `npg_` prefix and a password. This should never be committed.

---

## Priority Summary

| Priority | Count | Key Items |
|---|---|---|
| **Critical** | 4 | Dual JWT divergence (1.1), hardcoded secret (1.2), XSS in products API (1.3), track API phone leak (1.4) |
| **High** | 8 | TOCTOU race in optimistic locking (9.4), no status transition validation (9.5), hardcoded categoryId bug (9.3), unused cart cookie (4.2), silent dashboard failures (2.1-2.3), Chart.js not used (7.1) |
| **Medium** | 12 | Missing Zod validation (8.1), modal a11y (5.1), no pagination (6.3), duplicate checkAuth (9.1), per-instance rate limiter (1.5), missing test coverage (11), commit credentials risk (12.6) |
| **Low** | ~15 | Inline styles (9.2), unused dependencies (10), no CSRF (12.3), non-memoized callbacks (6.4), animation reduced motion (5.4) |
