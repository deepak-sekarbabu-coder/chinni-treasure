# Chinni Treasure — Improvement Tracker

> Last updated: 2026-08-05 | Project: chinni-treasure | Docs validated against live codebase

---

## Summary

| Status | Count |
|--------|-------|
| Fixed | 18 |
| Mitigated | 1 |
| Open | 2 |
| Deferred | 1 |

---

## Critical Security Fixes

| # | Issue | Status |
|---|---|---|
| 1 | **Hardcoded JWT fallback `"dev-secret"`** — mitigated by env validation (`src/lib/env.ts`) which throws in production if `JWT_SECRET` is missing. Confirmed: `requireEnv` allows dev-only fallback at line 14. | Mitigated |
| 2 | **Session cookie missing `Secure` flag** | **FIXED** — `src/lib/auth.ts:46-58` |
| 3 | **`sanitize()` is a simple regex, not DOMPurify** | **FIXED** — `src/lib/sanitize.ts` strips HTML angle brackets (`<>`) server-side to prevent XSS; React escapes output via JSX. (`isomorphic-dompurify` is a test-only dependency.) |
| 4 | **CORS defaults to `*`** | **FIXED** — `ALLOWED_ORIGIN` documented in `.env.example`, configurable via env |

---

## High Priority

| # | Issue | Status |
|---|---|---|
| 5 | **In-memory rate limiter ineffective on serverless** | **FIXED** — `src/lib/rate-limiter.ts` uses Redis `INCR`+`EXPIRE` (shared across instances) with an in-memory fallback when `REDIS_URL` is unset |
| 6 | **Tracking endpoint exposes full PII without auth** | **FIXED** — limited to orderNumber, status, trackingId, totalAmount, items |
| 7 | **Stats endpoint fetches ALL order items** | **FIXED** — `app/api/stats/route.ts` uses Prisma `groupBy` SQL aggregation |
| 8 | **Export endpoint loads entire DB into memory** | **FIXED** — `app/api/export/route.ts` uses cursor-based pagination in 1000-record batches |
| 9 | **Missing `ALLOWED_ORIGIN` env var in `.env.example`** | **FIXED** — added to `.env.example` |

---

## Medium Priority

| # | Issue | Status |
|---|---|---|
| 10 | **Root layout DB call on every page navigation** | **FIXED** — cart is hydrated client-side by `CartProvider` (localStorage/cookie); the root layout makes no DB call |
| 11 | **In-memory cache not shared across serverless instances** | **FIXED** — Redis caching integrated (`src/lib/redis-cache.ts`) with in-memory fallback |
| 12 | **`window.location.href` after admin login** | Deferred — full reload required for middleware cookie timing |
| 13 | **Loading spinners lack `role="status"` / `aria-label`** | **FIXED** — `LoadingSpinner.tsx` and `loading.tsx` |
| 14 | **Form error messages not linked to inputs** | **FIXED** — `app/order/page.tsx` uses `aria-describedby` + `aria-invalid` |
| 15 | **`outline: none` without `forced-colors` fallback** | **FIXED** — `app/styles/accessibility.css` has `@media (forced-colors: active)` block |
| 16 | **No structured error reporting** | **FIXED** — Axiom observability (`@axiomhq/nextjs`) for structured logs, Web Vitals, and unhandled request errors (see `docs/axiom-observability.md`) |
| 17 | **No startup env var validation** | **FIXED** — `src/lib/env.ts` with `requireEnv()` |

---

## Low Priority (Technical Debt)

| # | Issue | Status |
|---|---|---|
| 18 | **`generateOrderNumber()` uses `Math.random()`** | **FIXED** — `src/lib/utils.ts` uses `crypto.randomUUID()` |
| 19 | **Public OpenAPI spec with CORS `*`** | Open |
| 20 | **Admin dashboard is fully client-side** | Open — no SSR for admin pages |
| 21 | **Rate limiter memory leak** | **FIXED** — `src/lib/rate-limiter.ts` evicts expired entries every 5 minutes |
| 22 | **`postcss.config.mjs` exists but unused** | **FIXED** — file removed |

---

## Architecture Strengths (Worth Preserving)

- **Serializable transactions** for order placement with stock deduction
- **Optimistic concurrency** via `version` field on orders
- **Typed API client** with Zod schemas for both input and response validation
- **React Query** for server state with proper query key management
- **Clean separation**: `src/lib/`, `src/components/`, `src/types/` with a typed API layer
- **32 test files** covering API, library, components, and hooks
- **Comprehensive accessibility**: skip links, ARIA labels, `prefers-reduced-motion`, `prefers-contrast`, focus management
- **Prisma migrations** with incremental improvements (versioning, stock constraints, category query indexes)
- **30 modular CSS files** under `app/styles/` with consistent CSS variable tokens
- **Product image gallery + multi-image support** with primary image management
- **Shipping nudge** (free-shipping threshold progress) for conversion uplift
- **Category platform**: `/category/[slug]` pages, "Latest in Every Category" homepage section, full admin CRUD

---

## Implementation Log

| Date | Commit | Fixes Applied |
|------|--------|---------------|
| 2026-06-20 | `eff4100` | #2 Secure cookie, #3 DOMPurify, #7 Stats groupBy, #8 Export batching |
| 2026-06-20 | `6ee1683` | #9 ALLOWED_ORIGIN in .env.example |
| 2026-06-20 | `6ed6055` | #13 Loading spinner a11y, #14 Form error linking, #15 forced-colors |
| 2026-06-20 | `f8eef9b` | #21 Rate limiter eviction, #22 Remove postcss config |
| 2026-06-20 | `8b901f7` | #18 UUID order numbers |
| 2026-06-20 | `ec0302b` | #17 Startup env validation |
| 2026-07-12 | feature work | Razorpay Standard Checkout (replaces PhonePe), `compareAtPrice` discounts, product & category `isActive` toggles, **category management (CRUD, `/category/[slug]` pages, "Latest in Every Category" homepage section)**, Vercel Analytics, gallery, dynamic product `generateMetadata`, OOS handling |
| 2026-07-18 | validation | Docs re-validated against live codebase; all category features confirmed implemented; gallery, breadcrumbs, latest-category CSS module confirmed |
| 2026-07-25 | validation | Docs re-validated; CSS modules count updated to 30, product detail pages, shipping nudge, FallbackImage, SkeletonLoader, Markdown/JsonLd/Breadcrumbs/ProductImageGallery components, DIRECT_URL & NEXT_PUBLIC_IMAGE_UNOPTIMIZED env vars, jsbarcode for labels, Speed Insights, product/category form modals, shipping label modal |
| 2026-08-05 | validation | Docs re-validated; test file count corrected to 32 (183 cases); #5 Redis-backed rate limiter, #10 client-side cart hydration, #11 Redis cache, #16 Axiom observability marked Fixed; fallow report scripts (`npm run fallow:report`) + DB keep-alive cron added |
