# Chinni Treasure — Gaps Analysis

> Generated from codebase review of `chinni-treasure/` at `C:\Projects\website\chinni-treasure`
>
> Last updated: June 3, 2026

---

## 1. Critical Security Vulnerabilities

### ~~1.1 Dual JWT Libraries — Divergent Signing May Break Auth~~ ✅ FIXED

`jsonwebtoken` has been removed from `package.json`. `src/lib/auth.ts` now implements JWT natively using the Web Crypto API (`crypto.subtle`). `proxy.ts` uses `jose`. Both use HMAC-SHA256 with the same `JWT_SECRET`.

**Remaining concern:** Two separate JWT implementations (`crypto.subtle` in `auth.ts` vs `jose` in `proxy.ts`) could diverge if one is updated without the other. Consider consolidating to a single library.

### 1.2 Hardcoded Fallback JWT Secret

**Files:** `proxy.ts:5`, `src/lib/auth.ts:29`

```ts
process.env.JWT_SECRET || "dev-secret"
```

If `JWT_SECRET` is unset in production (misconfiguration), both systems silently fall back to `"dev-secret"`, allowing anyone to forge admin session tokens.

**Fix:** Throw on missing secret in production. Remove hardcoded fallback.

### ~~1.3 No Input Sanitization on Product Create/Update (XSS)~~ ✅ FIXED

`sanitize()` from `src/lib/sanitize.ts` is now applied to `name` and `description` in:
- `app/api/products/route.ts` (POST create)
- `app/api/products/[id]/route.ts` (PUT update)
- `app/api/orders/route.ts` (POST — customer fields)

### ~~1.4 Track API Phone Search Uses `contains` (Data Leak)~~ ✅ FIXED

**File:** `app/api/track/route.ts:52`

Phone search now uses exact match: `customerPhone: cleanPhone`. Phone input is validated to exactly 10 digits. Order number search still uses `contains` on `orderNumber`, which is acceptable for order lookup.

### 1.5 Rate Limiter Is Per-Instance (Ineffective in Serverless)

**File:** `src/lib/rate-limiter.ts:1`

The rate limiter uses an in-memory `Map`. On Vercel or multi-instance deployments, each instance tracks independently, making the 5-attempt limit effectively 5 × N instances.

**Fix:** Use a shared store (Redis, DB) or document the limitation.

---

## 2. Missing / Incomplete Error Handling

### ~~2.1 Admin Dashboard — Silent Failures on All Fetches~~ ✅ FIXED

`fetchStats()`, `fetchOrders()`, and `fetchProducts()` now show toast notifications on failure via `showToast("Failed to load stats", "error")` etc.

### ~~2.2 Admin Dashboard — No Response Handling for Status Update 409/400~~ ✅ FIXED

Non-ok responses from status update API now parse `res.json()` and call `showToast(data.error, "error")`.

### ~~2.3 Admin Dashboard — `handleSaveProduct` Ignores API Errors~~ ✅ FIXED

`handleProductSave` now has an `else` branch that shows `showToast(data.error || "Failed to save product", "error")`.

### ~~2.4 Checkout — Unhandled Non-JSON Response~~ ✅ FIXED

`app/order/page.tsx` now wraps the fetch in try-catch with `err instanceof Error ? err.message : "Something went wrong"`.

### 2.5 Admin Dashboard — Charts Section Hidden When Empty

**File:** `app/admin/page.tsx:463-486`

Charts section only renders when `chartData.length > 0` or `chartsLoading`. If stats fail to load or there are no orders, sections disappear silently.

**Fix:** Always show sections (with "No data" placeholder) even when empty or errored.

### 2.6 Orders API — `GET [id]` Bypasses Auth for Sensitive Data

**File:** `app/api/orders/[id]/route.ts:5-28`

The `GET /api/orders/[id]` endpoint has **no auth check** and no rate limiting. Anyone with a valid UUID can fetch any order's full details (name, address, phone, items, notes).

**Fix:** Add auth or a token-based access check for individual order lookup.

### ~~2.7 Product Delete — No Error Handling for Non-OK Responses~~ ✅ FIXED

`handleProductDeleteConfirmed()` now has an `else` branch that parses the error response and shows `showToast(data.error || "Failed to delete product", "error")`.

---

## 3. Type Safety Issues

### 3.1 All API Routes Use Unsafe `as` Casts on Request Bodies

**Files:** All route.ts files under `app/api/`

Every endpoint casts `request.json()` to `Record<string, unknown>` and extracts fields with `as string`. A malformed body with wrong types (e.g., `customerName: 123`) silently passes truthiness checks.

**Fix:** Use Zod schemas (already in dependencies) to validate request bodies. This would catch type mismatches at the boundary.

### ~~3.2 `checkAuth` Duplicated and Weakly Typed~~ ✅ FIXED (DRY)

`checkAuth` is now exported from `src/lib/auth.ts` and imported in all route files. However, the return type still uses `session as unknown as AdminSession` — an unchecked cast.

**Remaining:** Add a Zod-validated session schema to verify JWT payload shape.

### ~~3.3 Order Status Type Not Validated Server-Side~~ ✅ FIXED

Validated against a Zod enum schema (`OrderStatusSchema`) before passing to Prisma. Returns 400 with descriptive error for invalid values.

### ~~3.4 Product Price Can Produce NaN~~ ✅ FIXED

Both create and update endpoints now use Zod schemas (`CreateProductSchema` / `UpdateProductSchema`) with `z.coerce.number().positive()` to validate price. Returns 400 with descriptive error for invalid values.

### ~~3.5 Track API — Response Casts Ignore Actual DB Types~~ ✅ FIXED

Replaced `Array<Record<string, unknown>>` with Prisma-generated `(Order & { items: OrderItem[] })[]`. All manual `as string`/`as number` casts removed — fields are now accessed with full type safety.

---

## 4. SSR / CSR Hydration Mismatch Risks

### 4.1 Cart Loads from `localStorage` After Mount (Flash of Empty Cart)

**File:** `src/components/cart/CartProvider.tsx:52-65`

The cart starts as `[]` and hydrates asynchronously after mount. SSR always sees an empty cart. Any cart-dependent content flashes "empty" before the client-side state loads.

**Fix:** Use the server cart cookie (`src/lib/cart-cookie.ts`) to hydrate cart state server-side via a prop from `layout.tsx`.

### 4.2 Server Cart Cookie Exists but Is Never Used

**File:** `src/lib/cart-cookie.ts` (entire file — dead code)

AGENTS.md documents: "Server Cart Cookie enabling SSR cart hydration." The file defines `getCartFromCookies()`, `serializeCartCookie()`, and `getCartCookieOptions()` — but **nothing in the codebase calls these functions**. Not on order placement, not on page load, not in the layout.

**Fix:** Integrate the cart cookie into the order flow (serialize on add, read on SSR) or remove the unused code.

### 4.3 Track Page Is Fully Client-Side

**File:** `app/track/page.tsx`

The entire page is `"use client"` with no server component wrapper, missing SSR opportunity. No support for initial query params (e.g., `?orderId=...`).

**Fix:** Create a server component wrapper or accept initial params to SSR results.

---

## 5. Accessibility Issues

### 5.1 Modals Lack Focus Trapping

**Files:** `src/components/order/OrderDetailModal.tsx`, `app/admin/page.tsx` (tracking + delete modals)

**Fixed:**
- ✅ `role="dialog"`, `aria-modal="true"`, `aria-labelledby` on all modals
- ✅ Escape key handler on all modals
- ✅ Close button with `modal-close` class
- ✅ Body scroll lock while modal is open

**Still missing:**
- No focus trapping — tab can escape behind the modal
- Focus is not returned to the trigger element on close
- No `ref` management for initial focus

**Fix:** Implement focus trap with `useRef` + keyboard event handler, or use a headless modal library.

### ~~5.2 Admin Dashboard Tabs Lack ARIA Roles~~ ✅ FIXED

Tabs now have `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, `role="tabpanel"`, and `aria-labelledby`.

### ~~5.3 Toasts Are Not Dismissible~~ ✅ FIXED

Toasts now have:
- ✅ Close button (`toast-close`) with `aria-label="Dismiss notification"`
- ✅ `role="alert"` and `tabIndex={0}`
- ✅ Max 5 visible (oldest auto-removed)
- ✅ Auto-dismiss after 5 seconds
- ✅ Animated exit transition

### ~~5.4 Animations Ignore `prefers-reduced-motion`~~ ✅ FIXED

Comprehensive `@media (prefers-reduced-motion: reduce)` rules in `globals.css` disable all animations/transitions, with exceptions for functional motion (spinner, scroll indicator, focus outlines).

### 5.5 Admin Login Error Not Announced to Screen Readers

**File:** `app/admin/login/page.tsx:110-124`

When an error appears, focus is not moved to it. No `aria-live` region on the error container.

**Fix:** Add `aria-live="assertive"` to the error container and move focus to it.

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

### 6.3 Product Catalogue Has No Customer-Facing Pagination

**File:** `app/catalogue-content.tsx:97-111`

All products render in a flat grid with no pagination, search, or filter. Breaks down with 100+ products. Note: Admin API and UI now have pagination for both orders and products.

**Fix:** Add pagination, search, and category filtering to the customer-facing catalogue.

### 6.4 Non-Memoized Callbacks in Admin Dashboard

**File:** `app/admin/page.tsx:169-228`

`fetchStats`, `fetchOrders`, `fetchProducts` are recreated on every render. `handleAdvance` and `handleReject` are properly memoized with `useCallback`.

**Fix:** Wrap remaining functions with `useCallback` where passed as props.

---

## 7. Missing Features (Documented but Not Implemented)

### 7.1 Chart.js Installed but Unused

**File:** `package.json:25`

AGENTS.md says "Interactive Analytics powered by Chart.js." But `app/admin/page.tsx` renders **plain HTML tables** for chart data, not Chart.js visualizations.

**Fix:** Implement Chart.js charts or remove the dependency and update docs.

### 7.2 Excel Export Script Exists but Not Exposed

**File:** `scripts/export-to-excel.ts` (dead code)

No UI button, no API route. The feature is invisible to users.

**Fix:** Add a download button in admin dashboard or remove.

### ~~7.3 Product Badge Not Displayed on Catalogue~~ ✅ FIXED

`ProductCard` now renders badges with `<span className="product-card-badge">{product.badge}</span>` and corresponding CSS styles.

---

## 8. Missing Validation & Sanitization

### 8.1 No Zod Validation on Order Request Body

**File:** `app/api/orders/route.ts:55-73`

Fields are extracted via unsafe casts with only truthiness checks. No schema validation for email format, phone digits, PIN code format, valid state code, item UUIDs, positive prices/quantities.

**Fix:** Define and use a Zod schema for order creation payload (Zod is already in dependencies).

### 8.2 Track API — Partial Input Validation

**File:** `app/api/track/route.ts:45-58`

- ✅ Phone is now validated to exactly 10 digits
- ❌ `orderId` has no length validation before being passed to database queries

**Fix:** Validate max length and format for orderId before querying.

### ~~8.3 Product Update Endpoint Lacks Sanitization~~ ✅ FIXED

Both PUT and POST product handlers now apply `sanitize()` to `name` and `description`.

---

## 9. Code Quality Issues

### ~~9.1 Duplicate `checkAuth` in Every Route File~~ ✅ FIXED

`checkAuth` is now a single function exported from `src/lib/auth.ts` and imported by all route files.

### ~~9.2 Inline Styles Everywhere in Admin Dashboard~~ PARTIALLY FIXED

Many CSS utility classes have been added to `globals.css` (flex, gap, text, margin, button variants, etc.) and the admin page now uses them extensively. However, some inline styles remain for:
- Animation delays (`animationDelay: \`${idx * 0.08}s\``)
- Admin login page (still all inline)
- Specific one-off tweaks

**Remaining:** Move remaining inline styles to CSS classes, especially in admin login page.

### ~~9.3 `editProduct` Hardcodes `categoryId` to `"1"`~~ ✅ FIXED

Now correctly uses `product.categoryId ? product.categoryId.toString() : ""`.

### 9.4 Race Condition in Optimistic Locking (TOCTOU)

**File:** `app/api/orders/[id]/status/route.ts:36-99`

The version is read in a separate query from the update. Between reading the version and updating, another request can modify the order. The `order.update` does not guard with `where: { version: expectedVersion }`.

**Fix:** Add `where: { id, version: expectedVersion }` to the `update` call and check affected row count. Same fix needed in the rejection transaction branch.

### 9.5 No Server-Side Validation of Status Transitions

**File:** `app/api/orders/[id]/status/route.ts:85-99`

`ORDER_STATUS_FLOW` exists in `src/lib/constants.ts` and is imported in the admin dashboard (for UI), but is **never checked server-side**. An admin could skip from pending to shipped, reverse from delivered to packaging, or re-reject a rejected order.

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
| ~~`jsonwebtoken` + `@types/jsonwebtoken`~~ | ✅ **Removed** | Replaced by native `crypto.subtle` |
| `chart.js` | **Unused** | Dashboard uses tables, not charts |
| `exceljs` | **Unused in production** | Script exists but no API/UI invokes it |
| `@types/pg` | **Unnecessary** | Prisma abstracts the `pg` driver |
| `swagger-ui-react` | **Large bundle, verify usage** | Check if `/docs` page is sufficiently accessed to justify it |

---

## 11. Missing Tests

### 11.1 Test Coverage Assessment

**Tests now exist for:**
- ✅ Auth: `auth.test.ts`, `auth-fallback.test.ts`, `auth.login.test.ts`, `auth.logout.test.ts`, `auth.me.test.ts`
- ✅ Orders: `orders.test.ts`, `orders.id.test.ts`, `orders.status.test.ts`
- ✅ Products: `products.test.ts`, `products.id.test.ts`
- ✅ Stats: `stats.test.ts`
- ✅ Track: `track.test.ts`
- ✅ Cart: `CartProvider.test.tsx`, `cart-cookie.test.ts`
- ✅ Sanitization: `sanitize.test.ts`
- ✅ Rate limiting: `rate-limiter.test.ts`
- ✅ UI Components: `ToastProvider`, `StatusBadge`, `StockBadge`, `ProductCard`, `AdminStatCard`, `LoadingSpinner`, `SectionHeader`, `CheckoutProgress`, `OrderDetailModal`
- ✅ Lib utilities: `constants.test.ts`, `utils.test.ts`, `openapi-spec.test.ts`, `prisma.test.ts`, `prisma-production.test.ts`, `useScrollReveal.test.tsx`

### 11.2 Incomplete Test Setup Mocks

**File:** `src/test/setup.ts`

- ✅ Prisma mock now exists (`src/test/mocks/prisma.ts`)
- `next/headers` mock's `cookies()` is synchronous but Next.js 16 returns a Promise
- `next/image` mock returns `null` without forwarding props
- No mocks for `useToast` context (handled per-test)

### 11.3 Missing Test Scenarios

- Cart stock limit enforcement edge cases
- Optimistic locking version conflict scenarios
- Order status transition validation (valid/invalid flows)
- Rate limiting logic under concurrent requests
- Auth token expiration handling

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

An empty PostCSS config implies no plugins are configured. If no PostCSS plugins are needed, the file could be removed.

### 12.6 `.env` Contains Production Database Credentials

**File:** `.env`

The `.env` file contains a real Neon PostgreSQL connection string with an `npg_` prefix and a password. This should never be committed.

---

## Priority Summary

| Priority | Count | Key Items |
|---|---|---|
| **Critical** | 2 | Hardcoded JWT secret (1.2), Orders API auth bypass (2.6) |
| **High** | 5 | TOCTOU race in optimistic locking (9.4), no status transition validation (9.5), unused cart cookie (4.2), Chart.js not used (7.1), no Zod validation on orders (8.1) |
| **Medium** | 9 | Modal focus trapping (5.1), no customer pagination (6.3), per-instance rate limiter (1.5), stats API perf (6.1), admin login a11y (5.5), JWT implementation split (1.1 note), login page inline styles (9.2), commit credentials risk (12.6), lazy tab fetching (6.2) |
| **Low** | ~10 | Unused dependencies (10), no CSRF (12.3), non-memoized callbacks (6.4), empty PostCSS (12.5), sharp in devDeps (12.1), eslint-disable comments (9.7), rate limiter remaining (9.8), CORS headers (12.2), order number collision (12.4) |
| **Fixed** | 18 | Dual JWT (1.1), XSS sanitization (1.3), phone data leak (1.4), silent dashboard failures (2.1-2.4), delete product errors (2.7), shared checkAuth (3.2/9.1), status enum validation (3.3), NaN price (3.4), track API casts (3.5), ARIA tabs (5.2), dismissible toasts (5.3), reduced motion (5.4), product badges (7.3), categoryId bug (9.3), product sanitization (8.3) |
