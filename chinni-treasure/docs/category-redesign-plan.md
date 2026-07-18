# Plan: "Latest in Every Category" Home Section + Category Platform

**Date:** 2026-07-18
**Author:** Implementation planning pass (pre-code)
**Status:** ✅ **IMPLEMENTED** — All features shipped as of July 2026. This document is preserved for historical reference.

---

## 0. Current State (what already exists)

The codebase is further along than a greenfield build. The following **already exist** and should be reused, not rewritten:

| Capability | Location | Notes |
|---|---|---|
| `Category` model | `prisma/schema.prisma` | Has `id`, `name`, `slug` (unique), `description?`, `displayOrder`, `isActive`, `@map("categories")`. |
| Product → Category FK | `prisma/schema.prisma` | `Product.categoryId` (nullable) + `Product.category` relation (`onDelete: SetNull`). Index `@@index([categoryId])` exists. |
| `GET /api/categories` | `app/api/categories/route.ts` | Returns **active** categories ordered by `displayOrder`. Cached `s-maxage=300`. |
| Category client types | `src/lib/api/schemas.ts` | `CategorySchema` + `CategoriesResponseSchema` (array of `{id,name,slug,displayOrder}`). |
| `fetchCategories` | `src/lib/api/index.ts` | React-query fetch helper. |
| `useAdminCategories` | `src/lib/hooks/useAdminData.ts` | Query hook (`staleTime: 300_000`). Used only when catalogue tab active. |
| Admin product form | `src/components/admin/AdminCataloguePanel.tsx` | Already has a **Category `<select>`** bound to `productForm.categoryId`. |
| Catalogue controller | `src/lib/hooks/useAdminCatalogueController.ts` | Already tracks `categoryId` in form state and payload. |
| Seed categories | `prisma/seed-data.ts` | `SEED_CATEGORIES` (Accessories, Apparel, Watches, Home, Jewellery Organizer). |
| Product card UI | `src/components/ui/ProductCard.tsx` | Reusable; takes `ProductData`. |
| Catalogue content | `src/components/pages/catalogue-content.tsx` | Reusable grid + pagination + search + sort; can be forked for category pages. |
| `SectionHeader` / `Breadcrumbs` / `JsonLd` | `src/components/ui/*` | Reusable presentational components. |
| Sitemap | `app/sitemap.ts` | Iterates products only — needs category entries added. |
| OpenAPI spec | `src/lib/openapi-spec.ts` | Manual object — new endpoints should be documented here. |

### Decisions confirmed with user
- **categoryId stays optional** — products without a category simply won't appear in per-category sections. No forced migration of existing null-category products.
- **Category pages at `/category/[slug]`** — dedicated, SEO-friendly route.
- **This document is a plan** — implementation happens after approval.

---

## 1. Database / Prisma Changes

### 1.1 Schema refinements (`prisma/schema.prisma`)
- Keep `Category` model as-is (already supports unlimited categories, `isActive`, `displayOrder`, `slug`).
- **Add a composite index** to `Product` for efficient "latest per active category" queries:
  ```prisma
  @@index([categoryId, isActive, createdAt])
  ```
  This supports the query shape `WHERE categoryId = ? AND isActive = true ORDER BY createdAt DESC` and the "newest per category" grouping.
- Add `@@index([categoryId, stockQuantity])` is optional; the composite above is the priority.
- No enum or model additions required. `onDelete: SetNull` on `Product.category` is correct (deleting a category keeps the product but orphans it — acceptable given optional category).

### 1.2 Migration
- Create a new migration `YYYYMMDDHHMMSS_category_query_index` containing:
  ```sql
  -- Composite index for latest-per-category + active listing queries
  CREATE INDEX IF NOT EXISTS "products_category_active_created_idx"
    ON "products" ("category_id", "is_active", "created_at" DESC);

  -- Optional: ensure slugs are unique + lowercase-normalized at app layer
  ```
- **No data migration required** — existing `categoryId` nulls are allowed by decision. Seeded categories already populate the table.

---

## 2. Backend: Category Management API

Currently only `GET /api/categories` exists. Add a management surface.

### 2.1 `app/api/categories/route.ts` (extend)
- **GET** (public): already returns active categories. Add `?includeInactive=true` (admin only) variant returning all categories with `isActive`/`description` for the management table.
- **POST** (admin): create category.
  - Body (Zod `CreateCategorySchema`): `{ name: string.min(1), slug?: string, description?: string, displayOrder?: number, isActive?: boolean }`.
  - Auto-generate `slug` from `name` (kebab-case) if omitted; ensure uniqueness (retry on collision).
  - Auth: `checkAuth()` + CSRF (`validateCsrfOrigin`).
  - Returns the created `Category`.

### 2.2 `app/api/categories/[id]/route.ts` (new)
- **PUT** (admin): update name, slug, description, displayOrder, isActive.
  - Prevent setting `isActive: false` from deleting — just flips flag.
- **DELETE** (admin):
  - Reject (409) if any **non-deleted** product still references the category (`prisma.product.count({ where: { categoryId, deletedAt: null } })`).
  - Otherwise `prisma.category.delete`.
  - Clear category cache.

### 2.3 Cache invalidation
- Extend `src/lib/products-cache.ts` (or a new `src/lib/category-cache.ts`) to also cache/invalidate category lists with a short TTL. Add `clearCategoryCache()` called from the mutation routes.
- Reuse the existing `createCache` helper pattern.

---

## 3. Backend: "Latest Product per Category" API

### 3.1 `app/api/categories/latest/route.ts` (new, public)
Returns the newest product for **every active category**, avoiding N+1.

**Strategy (single query, no N+1):**
```ts
const categories = await prisma.category.findMany({
  where: { isActive: true },
  orderBy: { displayOrder: "asc" },
  select: {
    id: true, name: true, slug: true,
    products: {
      where: { isActive: true, deletedAt: null, stockQuantity: { gt: 0 } },
      orderBy: { createdAt: "desc" },
      take: 1,
      select: { /* product fields + images */ },
    },
  },
});
// Filter out categories whose `products` array is empty (no in-stock active product)
```
- This is **one DB round-trip** (Prisma resolves the nested relation in a single query with `take: 1`).
- Map to the requested envelope:
  ```json
  [
    { "category": { "id": 1, "name": "Bangles", "slug": "bangles" },
      "product": { "id": "...", "name": "...", "price": 760, "compareAtPrice": 999, "imageUrl": "...", "images": [...] } },
    ...
  ]
  ```
- **Exclude** inactive/out-of-stock products (per spec).
- **Cache:** `Cache-Control: public, s-maxage=60, stale-while-revalidate=120`. Optionally wrap with the in-memory `products-cache` for SSR.
- Add `LatestCategoryProductSchema` + `LatestCategoriesResponseSchema` to `src/lib/api/schemas.ts`.

### 3.2 Home page server component (`app/page.tsx`)
- Replace the current "recent 6 products" fetch with a call to the new latest-per-category query (direct Prisma or fetch `/api/categories/latest`).
- Keep `revalidate = 60`.
- Pass the result to a new `HomeContent` section.

---

## 4. Home Page UI: "Latest in Every Category"

### 4.1 New component `src/components/pages/LatestInEveryCategory.tsx`
- Receives `sections: Array<{ category: {name, slug}; product: ProductData }>`.
- **Desktop:** responsive CSS grid (3–5 cols via existing `app/styles/` variables + media queries). Reuse `.recently-added` / `.product-card` styling language for visual consistency.
- **Mobile:** horizontal scroll-snap track (same pattern as `RecentlyAddedProducts`) with left/right nav arrows; `scroll-snap-type: x mandatory`, `prefers-reduced-motion` respected.
- Each category block shows:
  - Category name (serif heading)
  - "View All" link → `/category/[slug]`
  - One product card: image (lazy, `next/image` + blur placeholder), name, price, discount (compareAtPrice strikethrough), "View Product" button → `/catalogue/[id]`.
- Gracefully hides categories with no eligible product (handled by API).

### 4.2 Styles
- Add `app/styles/latest-category.css` (imported in `app/globals.css` or `layout.tsx` following existing pattern). Respect `--gold`, `--cream`, fonts, focus rings, 44px touch targets from `docs/brief.md`.

### 4.3 Integration
- Render `<LatestInEveryCategory sections={...} />` in `HomeContent` **above** or **instead of** `RecentlyAddedProducts`. Recommend keeping `RecentlyAddedProducts` as a secondary "Fresh Arrivals" strip and adding the new section as the primary "Latest in Every Category" hero-adjacent section. Will confirm visual placement during build.

---

## 5. Category Listing Pages (`/category/[slug]`)

### 5.1 `app/category/[slug]/page.tsx` (new, server component)
- `generateStaticParams` → all active category slugs (for SSG/ISR).
- `generateMetadata` → category name/description SEO.
- Fetch category by slug; `notFound()` if missing/inactive.
- Fetch first page of products: `WHERE categoryId = ? AND isActive = true AND deletedAt = null`, ordered by `createdAt desc` (newest first), paginated.
- Render `Breadcrumbs` (Home → Category), `SectionHeader`, and a forked `CatalogueContent` (or a new `CategoryContent` that reuses the same grid/pagination/sort components but is scoped to the category + adds a category banner).
- Support `?page=` and `?sort=` (newest | price-asc | price-desc) and optionally `?badge=`.

### 5.2 Client component `src/components/pages/category-content.tsx` (new)
- Fork `catalogue-content.tsx` but:
  - Fixed `categorySlug` filter (no search-by-code needed, or keep optional).
  - Calls a new `fetchCategoryProducts(slug, page, sort)` in `src/lib/api/index.ts`.
  - Add a category hero banner using `category.name` + `category.description`.
  - "Back to all categories" / "View full collection" links.

### 5.3 Sitemap
- Extend `app/sitemap.ts` to push `${BASE_URL}/category/${slug}` for each active category.

---

## 6. Admin: Category Management UI

### 6.1 New admin tab "Categories"
- Extend `AdminTabKey` in `src/components/admin/AdminTabs.tsx` to include `"categories"`.
- Wire into `useAdminPageState` (enable `useAdminCategories` always when authenticated; add `categoriesMutation` states).
- Add `AdminCategoriesPanel.tsx` (client) rendering a table:
  - Columns: Name, Slug, Order, Active, Products count, Actions (Edit / Delete / Toggle active).
  - "Add Category" button → inline form/modal (name, slug auto, description, displayOrder, isActive).
  - Edit → same form pre-filled.
  - Delete → confirm modal (reuse `AdminDeleteConfirm` pattern); disabled/blocked if products exist.
  - Reorder via `displayOrder` numeric input (optional drag-drop deferred).

### 6.2 Mutations (`src/lib/hooks/useAdminMutations.ts`)
- Add `useCreateCategory`, `useUpdateCategory`, `useDeleteCategory`, `useToggleCategoryActive`.
- On success: `invalidateQueries({ queryKey: queryKeys.categories.all() })` + product list invalidation (since category flags affect listings).

### 6.3 Product Create/Edit UI
- The select already exists. Per decision (category **optional**), we keep it optional but:
  - Improve UX: show category count, allow quick "create category" inline? **Deferred** — the dedicated management page covers creation. Keep the dropdown, ensure it reflects live category list, and show a hint if none exist.
  - Ensure `categoryId` validation: if provided, must be a positive int (already coerced). No "prevent save without category" since optional was chosen.

---

## 7. Client API Layer

### 7.1 `src/lib/api/index.ts` additions
- `fetchCategoryLatest()` → `GET /api/categories/latest`.
- `fetchCategoryProducts(slug, page, sort, signal)` → `GET /api/category/${slug}/products`.
- `createCategory(input)`, `updateCategory(id, input)`, `deleteCategory(id)` → call new routes.

### 7.2 `src/lib/api/schemas.ts` additions
- `CreateCategorySchema`, `UpdateCategorySchema`, `CategoryDetailSchema` (includes `isActive`, `description`, `productCount?`).
- `LatestCategoryProductSchema`, `LatestCategorySectionSchema`, `LatestCategoriesResponseSchema`.
- Extend `CategorySchema` to optionally include `isActive`, `description` for admin views.

### 7.3 `src/lib/query-keys.ts`
- Extend `categories` with `lists`, `detail(id)`, `latest()`, `products(slug, page, sort)`.

---

## 8. Performance

- **No N+1:** `latest` endpoint uses a single nested `findMany` with `take: 1` per category relation.
- **Caching:** `s-maxage` + stale-while-revalidate on public endpoints; in-memory `products-cache` for SSR; React Query `staleTime` for client.
- **Lazy images:** `next/image` with `loading="lazy"` + blur placeholder + `sizes` responsive attrs (reuse `PRODUCT_IMAGE_QUALITY`, `BLUR_PLACEHOLDER`).
- **SSR/ISR:** Home `revalidate=60`; category pages `generateStaticParams` + `revalidate`.
- **Scales:** composite index; pagination on category pages; no full-table scans.

---

## 9. Tests

Add/extend under `src/__tests__/` (Vitest, following existing `products.test.ts` patterns):

1. `api/categories.test.ts` — GET public (active only), POST (auth + CSRF + slug gen + dup handling), PUT, DELETE (blocked when products exist, succeeds when empty).
2. `api/categories.latest.test.ts` — returns one newest in-stock active product per active category; excludes inactive/out-of-stock; empty categories omitted; shape matches envelope.
3. `api/categories.[slug].products.test.ts` — filtering, pagination, sort.
4. `lib/schemas.test.ts` — new Zod schemas parse correctly / reject bad input.
5. `hooks/useAdminCategoriesController.test.ts` — CRUD mutation flows + cache invalidation (mirror `useAdminCatalogueController.test.ts`).
6. Add Prisma mock entries in `src/__tests__/mocks/prisma.ts` for `category` if missing.

---

## 10. Documentation

- Extend `src/lib/openapi-spec.ts` with `Categories` tag + paths: `GET /api/categories`, `POST /api/categories`, `PUT /api/categories/{id}`, `DELETE /api/categories/{id}`, `GET /api/categories/latest`, `GET /api/category/{slug}/products`.
- Update `docs/brief.md` architecture notes (Category is now a first-class managed entity).
- Add a short `docs/categories.md` describing: how to add a category (admin), how the home section auto-populates, URL structure, and the "category optional" data policy.

---

## 11. Implementation Order (proposed)

1. **Prisma**: add composite index → `prisma migrate dev` → regenerate client.
2. **Schemas** (`schemas.ts`): category CRUD + latest envelopes.
3. **Category management API**: POST/PUT/DELETE + GET `?includeInactive`.
4. **Latest API**: `GET /api/categories/latest`.
5. **Category products API**: `GET /api/category/[slug]/products`.
6. **Client API + query-keys + cache** helpers.
7. **Home**: `LatestInEveryCategory` component + styles + wire into `HomeContent`/`page.tsx`.
8. **Category pages**: `app/category/[slug]/page.tsx` + `category-content.tsx` + sitemap.
9. **Admin**: Categories tab + panel + mutations.
10. **Tests** for each new surface.
11. **Docs**: openapi-spec, brief, categories.md.
12. **Verify**: `npm run lint`, `npm run typecheck` (or `tsc --noEmit`), `npm test`, `npm run build`.

---

## 12. Open Questions / Risks

- **Visual placement** of "Latest in Every Category" vs existing "Recently Added" — will keep both unless you prefer replacement.
- **Slug collisions** auto-resolved with `-2`, `-3` suffixes.
- **Category delete with deletedAt products**: we count only non-deleted products, so a category used only by "deleted" products can still be removed (products become orphaned/null category). Acceptable per optional-category decision.
- **`displayOrder` reorder UI**: numeric input in v1; drag-drop deferred.
- No breaking changes to existing product APIs (categoryId stays optional/nullable).
