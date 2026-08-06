# Codebase Architectural Gaps & Technical Debt

> **Last validated:** August 5, 2026 — Gaps and statuses re-validated against current codebase.

This document outlines identified areas for architectural improvement, technical debt, and inconsistencies found during a codebase analysis, categorized by severity.

## 1. Critical Gaps (Require immediate attention)

None currently identified.

## 2. Major Gaps (Architectural Improvements Needed)

* ~~**Monolithic Styling (`app/globals.css`)**~~
  * ~~**Issue:** The CSS file has grown to ~6,000 lines (5,987 as of last count), containing all styles for the entire application. This makes maintainability and CSS-variable management extremely difficult.~~
  * ~~**Recommendation:** Decompose the stylesheet into component-specific modules or CSS files. Adopt a consistent naming convention or consider CSS-in-JS (though Vanilla CSS is the current mandate).~~
  * **RESOLVED (June 27, 2026):** `app/globals.css` has been decomposed from ~5,025 lines into **30 modular CSS files** under `app/styles/`. The entry point now contains only `@import` statements. See `app/styles/` for the full breakdown.

* **Inconsistent Data Fetching Patterns (Improving)**
  * **Issue:** React Query (`@tanstack/react-query`) is used for admin dashboard data fetching (orders, stats, products), but some pages still use client-side effects or server rendering for data hydration.
  * **Note:** The migration from `useEffect`-based fetching to React Query is largely complete. Remaining `useEffect` calls are primarily for UI interactions (focus traps, scroll handling, modal transitions), not data fetching.
  * **Recommendation:** Continue standardizing on React Query for all client-side data fetching where applicable. Ensure server-rendered pages (catalogue, confirmation) have clear error boundaries.

## 3. Minor Gaps (Improvement / Best Practice)

* **Incomplete Testing Coverage**
  * **Issue:** Unit and integration tests are strong — **32 test files** under `src/__tests__/` cover utilities, API routes, components, and hooks — but end-to-end coverage of complex multi-step UI workflows (checkout, admin catalogue CRUD) is absent. `@testing-library/jest-dom` and `@testing-library/user-event` are dev dependencies; `@playwright/test` could be added for E2E groundwork.
  * **Recommendation:** Implement E2E tests with Playwright covering critical user journeys (browse → checkout → payment, admin order advancement).

* **Lack of Dynamic Metadata** (Mostly Resolved)
  * **Issue:** Basic SEO is handled via `sitemap.ts` and `robots.txt`. Product detail pages (`app/catalogue/[id]/page.tsx`) and category pages (`app/category/[slug]/page.tsx`) implement dynamic `generateMetadata` sourced from the database. The main catalogue listing page (`app/catalogue/page.tsx`) still lacks it, limiting search visibility for browsable collections.
  * **Resolution:** Dynamic product-detail metadata + category metadata added (SEO work, July 2026). Top-level catalogue/listing pages remain pending.
  * **Recommendation:** Add `generateMetadata` to `app/catalogue/page.tsx` and any other dynamic listing pages.

* ~~**In-Memory Cache Not Shared Across Serverless Instances**~~
  * ~~**Issue:** The in-memory cache (`src/lib/cache.ts`, `src/lib/products-cache.ts`) works in development but won't persist across serverless function invocations on Vercel.~~
  * **RESOLVED (Aug 5, 2026):** Redis caching integrated (`src/lib/redis.ts` + `src/lib/redis-cache.ts`) with an in-memory fallback when `REDIS_URL` is unset. Catalog, category, latest, recent, order, tracking, and stats routes now cache through Redis with short TTLs; `src/lib/cache-invalidate.ts` SCANs + DELs namespaces after mutations. See the architecture diagrams.
