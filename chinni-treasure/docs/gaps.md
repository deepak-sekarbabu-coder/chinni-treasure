# Codebase Architectural Gaps & Technical Debt

This document outlines identified areas for architectural improvement, technical debt, and inconsistencies found during a codebase analysis, categorized by severity.

## 1. Critical Gaps (Require immediate attention)

None currently identified.

## 2. Major Gaps (Architectural Improvements Needed)

*   **Monolithic Styling (`app/globals.css`)**
    *   **Issue:** The CSS file has grown to over 5,300 lines, containing all styles for the entire application. This makes maintainability and CSS-variable management extremely difficult.
    *   **Recommendation:** Decompose the stylesheet into component-specific modules or CSS files. Adopt a consistent naming convention or consider CSS-in-JS (though Vanilla CSS is the current mandate).

*   **Inconsistent Data Fetching Patterns (Partial)**
    *   **Issue:** The codebase has integrated React Query (`@tanstack/react-query`) for admin dashboard data fetching, but some pages (catalogue, track) still use `useEffect` for client-side fetching. No unified strategy for caching, loading state management, or error handling across all pages.
    *   **Recommendation:** Standardize on React Query for all client-side data fetching. Migrate remaining `useEffect`-based fetching to React Query hooks.

## 3. Minor Gaps (Improvement / Best Practice)

*   **Incomplete Testing Coverage**
    *   **Issue:** Unit tests are strong for utilities, isolated components, and API routes, but complex multi-step UI workflows (like the checkout process) and integration tests are less thoroughly tested.
    *   **Recommendation:** Implement higher-level integration or E2E tests covering critical user journeys.

*   **Lack of Dynamic Metadata**
    *   **Issue:** Basic SEO is handled via `sitemap.ts` and `robots.txt`, but individual product and category pages lack dynamic `metadata` generation in Next.js, impacting search engine visibility for dynamic content.
    *   **Recommendation:** Implement dynamic `generateMetadata` functions for all pages that render dynamic content from the database.

*   **In-Memory Cache Not Shared Across Serverless Instances**
    *   **Issue:** The in-memory cache (`src/lib/cache.ts`, `src/lib/products-cache.ts`) works in development but won't persist across serverless function invocations on Vercel.
    *   **Recommendation:** Use Vercel KV or Redis for production caching.
