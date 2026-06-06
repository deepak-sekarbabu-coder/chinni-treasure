# Chinni Treasure — Codebase Gaps Analysis

A systematic review of the codebase as of June 2026. Each gap is categorized by severity and type.

---

## 🔴 Critical

### 1. Credentials committed to version control
`.env` is tracked by git and contains live **Neon PostgreSQL** credentials (password: `npg_Gl0ZXpiqr4xV`) and a weak JWT secret (`dev-secret-key-change-in-production`). This is a security incident — rotate those credentials immediately.

### 2. Docs claim dependencies that don't exist in the codebase
Both `GEMINI.md` (Section 7) and `README.md` list these dependencies, but none are actually imported or used:

| Claimed | Reality |
|---|---|
| `jsonwebtoken` for JWT | `src/lib/auth.ts` uses Web Crypto API (`crypto.subtle`) directly — pure HMAC-SHA256, no library |
| `chart.js` for dashboard charts | Admin dashboard renders a plain HTML table (`chart-row` divs), no Chart.js anywhere |
| `swagger-ui-react` for API docs | `app/docs/page.tsx` is a hand-rolled TypeScript component that renders the OpenAPI spec as formatted HTML |

This will confuse any developer onboarding via docs. `jsonwebtoken` and `chart.js` appear in `package-lock.json` as transitive deps (not direct), and `swagger-ui-react` isn't in the lock file at all.

### 3. Two divergent JWT implementations
- `proxy.ts` (Next.js middleware) uses the **`jose` library** (`jwtVerify`) to verify session tokens
- `src/lib/auth.ts` uses the **Web Crypto API** (`crypto.subtle.sign`/`verify`) to sign and verify tokens

Both use the same secret and HS256 algorithm, so they happen to interoperate. But the code paths are entirely different — any divergence in base64url encoding, header handling, or algorithm defaults would silently break authentication across the boundary between middleware and API routes.

---

## 🟠 High

### 4. No Next.js error boundaries
- **No `error.tsx`** at any route level — unhandled errors in server components or client components will crash the page to white-screen or Next.js generic error overlay
- **No `loading.tsx`** at any route level — page transitions have no automatic loading state (the app uses manual `<LoadingSpinner>` components, but route-level Suspense boundaries are absent)
- **No `not-found.tsx`** — navigating to a non-existent route gets the default Next.js 404 page, breaking the luxury brand experience

### 5. No SEO infrastructure
- **No `robots.txt`** in `public/` — search engines have no crawling guidance
- **No `sitemap.xml`** or `sitemap.ts` — no index of pages for search engines
- **No `metadata` exports** on most page layouts — missing `metadata` on `catalogue/page.tsx`, `order/page.tsx`, `track/page.tsx`, `confirmation/[id]/page.tsx` means those pages get no title/description tags

### 6. TypeScript type safety gaps
- `checkAuth()` in `auth.ts` returns `session as unknown as AdminSession` — bypasses the type system entirely. If the JWT payload shape ever changes, this silently produces incorrect types
- `statusUpdateData()` in `orders/[id]/status/route.ts` casts `status as OrderStatusValue` without runtime validation — the Zod schema validates the request body, but the cast inside the function body isn't type-narrowed
- `auth.ts` imports are misleading — top comment references `jose` and `jsonwebtoken` but the implementation uses neither

---

## 🟡 Medium

### 7. Duplicate export logic
- `scripts/export-to-excel.ts` is a standalone script that duplicates the logic of `app/api/export/route.ts` (the API route that generates Excel exports on-demand). The script is marked with `// fallow-ignore-next-line unused-files` — it's intentionally dead code
- `exports/` directory exists but is empty — unclear where exports are intended to land

### 8. Inconsistent CORS configuration
`next.config.ts` sets CORS headers for only `/api/track` and `/api/orders`. Public endpoints (`/api/products`, `/api/docs`) have no CORS headers. If these ever need to be accessed cross-origin (e.g., a mobile app or partner integration), they'll fail.

### 9. Aggressive HTML sanitization
`sanitize.ts` strips ALL HTML tags via `ALLOWED_TAGS: []`. This means:
- Product descriptions with formatting (bold, italic, line breaks) will be completely flattened to plain text
- Admin notes with any HTML structure will be stripped
- The sanitization is applied to `customerName`, `customerEmail`, `addressLine1`, `city` in the order creation flow — these should be plain text anyway, but product content in the database could already have formatting

### 10. In-memory rate limiter doesn't scale
`rate-limiter.ts` uses a local `Map<string, {...}>` — rate limit state is per-process. Any server restart or horizontal scaling (multiple instances via Vercel) resets the counters, making the rate limit ineffective under load.

### 11. No caching on `/api/products`
`/api/stats` has a 30s cache and `/api/track` has a 15s cache, but `/api/products` has no response caching. The catalogue fetches products on every page load.

### 12. Checkout form missing `addressLine2`
The API schema (`CreateOrderSchema`) supports `addressLine2` as an optional field, but the checkout form (`app/order/page.tsx`) has no field for it. Customers can't provide apartment/suite/landmark info.

### 13. Transaction ID requirement is fragile
The checkout sends `transactionId: form.transactionId.trim() || undefined` — the API Zod schema requires `transactionId` with `min(1)`, but the `|| undefined` would make it `undefined` if empty, causing a validation error. It works because the form has a non-empty check before submission, but the code path is misleading.

---

## 🔵 Low

### 14. Monolithic CSS
`app/globals.css` is ~2,800 lines / ~98KB — every component style lives in one file. No CSS Modules, no CSS-in-JS, no splitting. Maintainable at current scale but will become unwieldy as the project grows.

### 15. Large page components
- `app/admin/page.tsx`: **663 lines** — state, effects, fetch functions, modals, tabs, and event handlers all in one component
- `app/order/page.tsx`: **352 lines** — includes 5 inline sub-components (`PersonalDetailsStep`, `DeliveryDetailsStep`, `PaymentStep`, `StepNavigation`, `StickyCheckoutBar`) that could be extracted to separate files

### 16. Empty PostCSS config
`postcss.config.mjs` is an empty config object (`const config = {}`). Harmless (no Tailwind to configure), but unnecessary file.

### 17. No admin self-service
- No password reset / forgot password flow for admins
- No admin profile management (change email, password from within the dashboard)
- Passwords can only be changed via database directly

### 18. No customer account system
The app is fully guest-based. Customers have no accounts, no persistent wishlist, no order history beyond the tracking page (which requires knowing the order ID or phone number). No email receipts or order confirmations are sent.

### 19. No response type validation on admin page API calls
`fetchOrders`, `fetchStats`, `fetchProducts` in `app/admin/page.tsx` all `await res.json()` and cast to the expected TypeScript interfaces — but there's no runtime validation of the API response shapes. A backend schema change could silently produce incorrect data.

### 20. Next.js metadata and viewport defaults
The root `layout.tsx` doesn't export explicit `metadata` or `viewport` — Next.js uses defaults. No explicit `theme-color`, no `description`, and the viewport defaults to the browser standard rather than being explicitly set for the brand.

---

## 📊 Summary

| Severity | Count |
|---|---|
| 🔴 Critical | 3 |
| 🟠 High | 3 |
| 🟡 Medium | 7 |
| 🔵 Low | 7 |
| **Total** | **20** |

### Quick priorities
1. **Rotate exposed credentials** — `.env` with live DB creds in git
2. **Fix documentation** — update GEMINI.md and README.md to reflect actual dependencies
3. **Add error boundaries** — `error.tsx`, `loading.tsx`, `not-found.tsx` at route level
4. **Unify JWT implementation** — either all `jose` or all Web Crypto, not both
5. **Add SEO basics** — `robots.txt`, `sitemap.ts`, `metadata` exports
