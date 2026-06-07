# Codebase Architectural Gaps & Technical Debt

This document outlines identified areas for architectural improvement, technical debt, and inconsistencies found during a codebase analysis, categorized by severity.

## 1. Critical Gaps (Require immediate attention)

*   **Fragile Sanitization Logic (`src/lib/sanitize.ts`)**
    *   **Issue:** The project documentation claims the use of `isomorphic-dompurify` for XSS protection, but the implementation currently relies on simple regex-based HTML stripping. This is highly susceptible to bypasses and risks XSS vulnerabilities.
    *   **Recommendation:** Replace regex-based sanitization with a robust library like `isomorphic-dompurify` or `sanitize-html` immediately, as intended by original project design.

## 2. Major Gaps (Architectural Improvements Needed)

*   **Monolithic Styling (`app/globals.css`)**
    *   **Issue:** The CSS file has grown to over 5,000 lines, containing all styles for the entire application. This makes maintainability and CSS-variable management extremely difficult.
    *   **Recommendation:** Decompose the stylesheet into component-specific modules or CSS files. Adopt a consistent naming convention or consider CSS-in-JS (though Vanilla CSS is the current mandate).

*   **Violations of Separation of Concerns (`app/admin/page.tsx`)**
    *   **Issue:** The Admin dashboard page component is monolithic (~600 lines), mixing complex business logic, UI state management, API data fetching, and layout structure.
    *   **Recommendation:** Refactor into smaller, feature-specific sub-components within `src/components/admin/` and leverage custom hooks (e.g., `useAdminStats`, `useAdminOrders`) to extract logic from the page component.

*   **Inconsistent Data Fetching Patterns**
    *   **Issue:** The codebase uses a mix of Server Component data fetching and manual `useEffect` client-side fetching. There is no unified strategy for caching, loading state management, or error handling.
    *   **Recommendation:** Standardize on a data fetching strategy. Integrate libraries like `@tanstack/react-query` to unify the client-side data management, simplify loading/error state handling, and improve caching.

## 3. Minor Gaps (Improvement / Best Practice)

*   **Duplicated Validation Logic**
    *   **Issue:** While `zod` is used on the server side to validate API routes, frontend forms implement manual validation logic. This leads to inconsistency, increased development time, and bugs.
    *   **Recommendation:** Share `zod` schemas between the frontend and backend (e.g., in `src/types/` or `src/lib/schemas/`) to enable unified, single-source-of-truth validation.

*   **Incomplete Testing Coverage**
    *   **Issue:** Unit tests are strong for utilities and isolated components, but complex multi-step UI workflows (like the checkout process) are less thoroughly tested, especially for edge cases or intermediate state transitions.
    *   **Recommendation:** Implement higher-level integration or E2E tests covering critical user journeys.

*   **Lack of Dynamic Metadata**
    *   **Issue:** Basic SEO is handled via `sitemap.ts` and `robots.txt`, but individual product and category pages lack dynamic `metadata` generation in Next.js, impacting search engine visibility for dynamic content.
    *   **Recommendation:** Implement dynamic `generateMetadata` functions for all pages that render dynamic content from the database.
