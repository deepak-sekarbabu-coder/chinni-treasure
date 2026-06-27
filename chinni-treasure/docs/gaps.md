# Codebase Architectural Gaps & Technical Debt

> **Last validated:** June 27, 2026 — Metrics refreshed against current codebase.

This document outlines identified areas for architectural improvement, technical debt, and inconsistencies found during a codebase analysis, categorized by severity.

## 1. Critical Gaps (Require immediate attention)

None currently identified.

## 2. Major Gaps (Architectural Improvements Needed)

* ~~**Monolithic Styling (`app/globals.css`)**~~
  * ~~**Issue:** The CSS file has grown to ~6,000 lines (5,987 as of last count), containing all styles for the entire application. This makes maintainability and CSS-variable management extremely difficult.~~
  * ~~**Recommendation:** Decompose the stylesheet into component-specific modules or CSS files. Adopt a consistent naming convention or consider CSS-in-JS (though Vanilla CSS is the current mandate).~~
  * **RESOLVED (June 27, 2026):** `app/globals.css` has been decomposed from ~5,025 lines into **26 modular CSS files** under `app/styles/`. The entry point now contains only 48 lines of `@import` statements. See `app/styles/` for the full breakdown.

* **Inconsistent Data Fetching Patterns (Improving)**
  * **Issue:** React Query (`@tanstack/react-query`) is used for admin dashboard data fetching (orders, stats, products), but some pages still use client-side effects or server rendering for data hydration.
  * **Note:** The migration from `useEffect`-based fetching to React Query is largely complete. Remaining `useEffect` calls are primarily for UI interactions (focus traps, scroll handling, modal transitions), not data fetching.
  * **Recommendation:** Continue standardizing on React Query for all client-side data fetching where applicable. Ensure server-rendered pages (catalogue, confirmation) have clear error boundaries.

## 3. Minor Gaps (Improvement / Best Practice)

* **Incomplete Testing Coverage**
  * **Issue:** Unit tests are strong for utilities, isolated components, and API routes, but complex multi-step UI workflows (like the checkout process) and integration tests are less thoroughly tested.
  * **Recommendation:** Implement higher-level integration or E2E tests covering critical user journeys.

* **Lack of Dynamic Metadata**
  * **Issue:** Basic SEO is handled via `sitemap.ts` and `robots.txt`, but individual product and category pages lack dynamic `generateMetadata` functions in Next.js, impacting search engine visibility for dynamic content.
  * **Recommendation:** Implement dynamic `generateMetadata` functions for all pages that render dynamic content from the database.

* **In-Memory Cache Not Shared Across Serverless Instances**
  * **Issue:** The in-memory cache (`src/lib/cache.ts`, `src/lib/products-cache.ts`) works in development but won't persist across serverless function invocations on Vercel.
  * **Recommendation:** Use Vercel KV or Redis for production caching.
