# Chinni Treasure — Ponytail Audit

## What this repo does:

Chinni Treasure is a luxury e-commerce storefront built with Next.js 16, React 19, Prisma, and PostgreSQL. It sells artisan-crafted goods through a guest cart, multi-step checkout with Indian address validation, Razorpay or manual payments, and admin-managed catalogues and orders. Cache ownership is intentionally split across modules (catalogue, order, stats, Redis) with in-memory fallbacks. The expected load is moderate: one operator managing catalogue/inventory, many customers browsing and purchasing. Redis is optional; in-memory cache falls back when REDIS_URL is not set.

## Findings

### Must fix (bug, security, data loss, breaks at expected load)

1. **No DB unique index on transactionId** (`src/lib/order-intake.ts:251-253`)
   - **What this is:** The `placeOrder` function explicitly documents this as a "shortcut": no DB unique index on `transactionId`, relying only on Serializable transaction isolation to prevent duplicates
   - **Problem:** Concurrent orders with the same `transactionId` could both be created; a single payment could accidentally pay for multiple orders
   - **Fix:** Add `@@unique` index on `transactionId` in Prisma schema, create a migration to add the constraint
   - **If we skip it:** Duplicate orders from the same payment, accounting disputes, customer confusion about which order is "theirs"

2. **CSRF origin validation blocks non-browser clients** (`src/lib/csrf.ts:35-49`)
   - **What this is:** `validateCsrfOrigin` returns a 403 Forbidden response when the request lacks both `Origin` and `Referer` headers
   - **Problem:** Non-browser clients (curl scripts, automation tools, API testing tools) always fail in production since they don't send these headers; the dev-only localhost escape hatch doesn't help in production
   - **Fix:** Add API token-based authentication alternative, or make CSRF validation configurable/skippable for certain routes with proper auth alternatives
   - **If we skipped it:** Legitimate automation and API tooling blocked, poor developer/tool experience, CI/CD pipelines may fail

3. **Rate limiting collapses to "unknown" IP when behind proxy** (`src/lib/rate-limiter.ts:53-58`)
   - **What this is:** `getClientIp` reads `x-forwarded-for` and `x-real-ip` headers, falling back to `"unknown"` when absent
   - **Problem:** All clients map to the same `"unknown"` IP, so one client's rate limit counts against all others; effectively global rate limits rather than per-client
   - **Fix:** Ensure the deployment proxy forwards `x-forwarded-for`, or implement per-session/IP tracking differently, or add client identifier tracking
   - **If we skipped it:** Rate limits either too restrictive (one counter for all) or easily bypassable (ignore the headers)

4. **Catalogue cache invalidation may miss mutation routes** (multiple API routes across app/api/)
   - **What this is:** `revalidateCatalogue: true` in guard options triggers `invalidateCatalogCaches()` which clears all 6 catalogue namespaces (products, catindex, categories, catlatest, catpage, giftboxes) + revalidates tagged SSR pages
   - **Problem:** If any product/category mutation route doesn't set `revalidateCatalogue: true`, the in-memory `catIndexCache` and Redis caches remain stale for up to 60s after an admin edit
   - **Fix:** Audit all admin API routes (products, categories, orders) and ensure `revalidateCatalogue: true` is set in their guard options
   - **If we skipped it:** Admins edit products/categories and old data persists in public cache, users see stale data until TTL expires

### Should fix (risky code without test, real slowness, duplication, function mixing jobs)

5. **`computePricing` doesn't validate stateCode is a valid Indian state** (`src/lib/pricing.ts:59-78`)
   - **What this is:** The function checks `stateCode === "TN"` for ₹150 shipping, all other codes get ₹200 outside Tamil Nadu
   - **Problem:** No validation that `stateCode` is actually from the `INDIAN_STATES` list; any arbitrary 2-letter code gets ₹200 shipping, potentially wrong costs for valid Indian states
   - **Fix:** Add validation using `INDIAN_STATES.some(s => s.code === stateCode)`, default to `OUTSIDE_TAMIL_NADU` (₹200) for invalid codes
   - **If we skipped it:** Wrong shipping costs for orders to valid Indian states not "TN", customer confusion at checkout

6. **`listLatestPerCategory` has per-instance cache when Redis is offline** (`src/lib/product-read.ts:561-566`)
   - **What this is:** The function uses `catLatestCache` with 60s TTL; the ponytail comment acknowledges "the 60s cache is per-instance when Redis is off, so cold serverless instances still pay one query per request"
   - **Problem:** Cold serverless instances (no Redis) pay one Postgres query per request even though data changes rarely (60s TTL)
   - **Fix:** Set `REDIS_URL` in production deployment, or implement ISR (incremental static regeneration) pattern
   - **If we skipped it:** Higher latency for cold starts, more DB load on serverless instances

7. **`refreshCatalogue` only invalidates specific paths on admin success** (`src/lib/route-guard.ts:174-179,223-225`)
   - **What this is:** `refreshCatalogue()` revalidates `/catalogue`, `/`, and `/category` layout paths via `revalidatePath`
   - **Problem:** If admin edits a product that appears on other unlisted pages (custom pages, search results, etc.), those caches remain stale
   - **Fix:** Either make revalidation more comprehensive (e.g., clear all tags or document which paths are covered) or add more `revalidatePath` calls for known consumption paths
   - **If we skipped it:** Some cache keys remain stale after admin edits, requiring manual cache purge or waiting for TTL expiry

## Verdict:

The codebase is generally well-structured with clear module boundaries and shared contracts, but has 4 must-fix issues that risk data integrity (duplicate payments), security (blocked automation), and user experience (stale caches, wrong shipping costs). The should-fix items are real but lower-risk concerns about state validation, cache behavior, and revalidation coverage.

## Lean:

-7 lines, -0 dependencies possible (the fixes are one-line changes or config additions; no new dependencies needed)

## Not checked:

- The checkout flow end-to-end (payment gateway integration not runnable without Razorpay keys and PostgreSQL)
- Redis caching behavior (Redis not configured in this environment)
- Admin UI flows (require session authentication)
- Performance benchmarks under real load