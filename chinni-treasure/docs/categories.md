# Categories & "Latest in Every Category"

> **Last validated against codebase:** August 22, 2026 — cache invalidation notes re-verified against the catalogue-cache module (`products-cache` was removed in the Aug 14, 2026 cache-ownership refactor). Migration, routes, cache headers, and tests re-verified August 5, 2026.

This document describes the category management and category-based browsing
feature added to the Chinni Treasure storefront.

## Overview

Products are organized into **categories** (e.g. Rings, Necklaces, Bracelets).
The homepage now showcases the **latest eligible product per active category**
under a "Latest in Every Category" section, and each category has its own
browsable, paginated, sortable listing page at `/category/[slug]`.

## Data model

- `Category` lives in the Prisma schema (`prisma/schema.prisma`) with fields:
  `id, name, slug (unique), description?, displayOrder, isActive`.
- `Product.categoryId` is a nullable foreign key (`onDelete: SetNull`).
- Migration `20260718000000_category_latest_index` adds a composite index
  `products_category_active_created_idx ON products (category_id, is_active, created_at DESC)`
  to support "latest product per active category" and category listing queries
  without full table scans.

## Backend APIs

| Method | Path | Auth | Purpose |
| ------ | ---- | ---- | ------- |
| GET | `/api/categories` | Public (admin when `?includeInactive=true`) | List categories. Public returns active only; admin returns all with `productCount`. |
| POST | `/api/categories` | Admin + CSRF | Create category. Slug auto-generated (kebab-case) from name when omitted. |
| PUT | `/api/categories/[id]` | Admin + CSRF | Update a category. Unique-slug generation on slug change. |
| DELETE | `/api/categories/[id]` | Admin + CSRF | Delete a category. Blocked (409) if any active product references it. |
| GET | `/api/categories/latest` | Public | One nested query → newest in-stock, active product per active category. Empty categories omitted. |
| GET | `/api/category/[slug]/products` | Public | Paginated, sortable (`newest`, `price-asc`, `price-desc`) product listing for a category. 404 for unknown/inactive slug. |

### Performance notes

- `/api/categories/latest` uses a **single** `prisma.category.findMany` with a
  nested `products` relation (`take: 1`, ordered by `createdAt desc`) — one DB
  round trip regardless of category count (no N+1).
- Caching headers: `latest` and `[slug]/products` use
  `Cache-Control: public, s-maxage=60, stale-while-revalidate=120`; public
  `/api/categories` uses `s-maxage=300, stale-while-revalidate=600`.
- Category mutations call `invalidateCatalogCaches()` (from `catalogue-cache`) so
  the cached category listings (and the rest of the catalogue caches) invalidate.

## Frontend

### Homepage — "Latest in Every Category"

- Server component `app/page.tsx` fetches the latest-per-category data
  (`revalidate = 60`) and passes it to `HomeContent`.
- `LatestInEveryCategory` (`src/components/pages/LatestInEveryCategory.tsx`)
  renders a responsive grid that collapses to a scroll-snap track on mobile
  with prev/next controls. Each card links to the product and to the category
  page ("View All").

### Category pages — `/category/[slug]`

- `app/category/[slug]/page.tsx` is a server component with
  `generateStaticParams` (active slugs), `generateMetadata` (SEO), and
  `revalidate = 60`. Includes breadcrumbs + JSON-LD.
- `CategoryContent` (`src/components/pages/category-content.tsx`) is a client
  component using React Query (`useCategoryProducts`) for pagination/sort, with
  a `useResponsivePageSize` hook for grid density.
- Styling: `app/styles/products.css` (toolbar/sort) and
  `app/styles/latest-category.css` (homepage section).

### Admin — Categories tab

- `AdminTabs` gained a "categories" tab (🏷).
- `AdminCategoriesPanel` (`src/components/admin/AdminCategoriesPanel.tsx`)
  provides an inline create/edit form, a sortable table (name, slug, order,
  product count, status, actions), enable/disable, and a delete-confirmation
  modal that blocks deletion when products exist.
- Controller: `useAdminCategoriesController`; mutations in
  `useAdminMutations` (`useCreateCategory`, `useUpdateCategory`,
  `useDeleteCategory`, `useToggleCategoryActive`).

## Tests

- `src/__tests__/api/categories.test.ts` — GET (public/admin), POST (create,
  validation, duplicate slug, auth).
- `src/__tests__/api/categories.id.test.ts` — PUT (update, 404), DELETE (blocked
  when products exist, success, auth).
- `src/__tests__/api/categories.latest.test.ts` — latest-per-category shape and
  empty-category omission.
- `src/__tests__/api/categories.slug.products.test.ts` — category product
  listing, 404s, sort.
- `src/__tests__/lib/category-schemas.test.ts` — Zod schema validation.

## OpenAPI

`src/lib/openapi-spec.ts` documents the `Categories` tag and all category paths.
