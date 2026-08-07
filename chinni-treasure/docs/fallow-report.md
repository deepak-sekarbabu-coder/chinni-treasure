# Fallow Analysis Report — Chinni Treasure

> **Generated:** 2026-08-07 · **Fallow version:** 3.14.0 (schema 7) · **Command:** `npm run fallow:report`
> Raw JSON sources: `fallow-health.json`, `fallow-dead.json`, `fallow-dupes.json` (regenerate with `npx fallow <analysis> --format json`).

## Summary

| Metric | Value |
| --- | --- |
| **Health score** | **87.8 / 100 (grade A)** |
| Maintainability index | 92.5 (good) |
| Files analyzed | 237 |
| Lines of code | 33,931 |
| Functions analyzed | 1,742 |
| Functions above complexity threshold | **96** (🔴 26 critical · 🟠 25 high · 🟡 45 moderate) |
| Functions > 60 LOC | 51.7 per 1k functions |
| Dead files | 0 (0%) |
| Dead exports | 3 (0.9%) |
| Duplicated lines | 1,459 (5.2%) across 42 files |
| Circular dependencies | 0 |
| Unused dependencies | 0 |
| Change hotspots (6 mo) | 0 |
| Avg cyclomatic | 2 (p90: 4) |
| Istanbul coverage matched | 95 / 1742 functions (5.5%) |

**Health score penalties:** dead_exports −0.2 · unit_size −10 · coupling −1.8 · duplication −0.2

**Exit status:** analysis fails (non-zero) when any category has issues: dead-code (8), dupes (42 groups), health (96 above threshold).

## Progress Tracker

Check off categories as they are resolved (fallow will confirm with a clean exit):

- [ ] **Dead code** — 23 issues (3 files, 10 exports, 5 types, 1 test-only dep, 4 stale suppressions)
- [ ] **Duplication** — 42 clone groups / 100 instances, 1,459 lines (5.2%)
- [ ] **Complexity** — 96 functions above threshold (26 critical, 25 high, 45 moderate)
- [ ] **File health** — 193 files scored; resolve the highest-risk files first
- [ ] **Refactoring targets** — 10 prioritized recommendations

---

## 1. Dead Code (8 issues)

### 1.1 Unused files (0)

Files not reachable from any entry point. Verify each is truly obsolete before deleting.

| File | Status |
| --- | --- |

### 1.2 Unused exports (2)

Exported symbols with no known consumers.

| File | Export | Line | Status |
| --- | --- | --- | --- |
| `lib/axiom/client.ts` | `logger` | 22 | [ ] |
| `lib/axiom/client.ts` | `useLogger` | 30 | [ ] |

### 1.3 Unused type exports (1)

| File | Type | Line | Status |
| --- | --- | --- | --- |
| `src/__tests__/mocks/redis.ts` | `MockRedisSetCall` | 2 | [ ] |

### 1.4 Test-only production dependencies (0)

Consider moving to `devDependencies`.

| Package | File | Status |
| --- | --- | --- |

### 1.5 Stale suppressions (4)

Suppression comments that no longer match any issue (mostly a typo: `unused-files` → `unused-file`).

| File | Line | Issue kind | Status |
| --- | --- | --- | --- |
| `scripts/export-to-excel.ts` | 1 | `unused-file` | [ ] |
| `src/__tests__/mocks/prisma.ts` | 1 | `unused-file` | [ ] |
| `src/__tests__/mocks/redis.ts` | 1 | `unused-file` | [ ] |
| `src/__tests__/utils/api-test.ts` | 1 | `unused-file` | [ ] |

---

## 2. Duplication (42 clone groups · 1,459 lines · 5.2%)

Identical code blocks detected via suffix-array analysis. Groups with the most lines are the highest-value extraction targets.

> **Note:** some groups overlap — e.g. rows 3–4 are the same duplicated CSRF-check + rate-limit block spread across API routes, detected at different token granularities. Fixing the shared block clears both.

| # | Lines | Locations | Status |
| --- | --- | --- | --- |
| 1 | 248 | `src/components/order/OrderSummaryCard.tsx:24-198`<br>`src/components/ui/ShippingNudgePopup.tsx:12-84` | [ ] |
| 2 | 98 | `app/styles/admin.css:1015-1063`<br>`app/styles/loading.css:52-100` | [ ] |
| 3 | 92 | `app/api/auth/login/route.ts:29-36`<br>`app/api/categories/[id]/route.ts:52-60`<br>`app/api/categories/route.ts:115-125`<br>`app/api/create-order/route.ts:47-55`<br>`app/api/orders/[id]/status/route.ts:79-86`<br>`app/api/orders/[id]/tracking/route.ts:28-36`<br>`app/api/orders/route.ts:94-113`<br>`app/api/products/[id]/route.ts:72-80`<br>`app/api/products/route.ts:175-183` | [ ] |
| 4 | 83 | `app/api/auth/login/route.ts:29-36`<br>`app/api/categories/[id]/route.ts:52-60`<br>`app/api/categories/route.ts:115-125`<br>`app/api/orders/[id]/status/route.ts:79-86`<br>`app/api/orders/[id]/tracking/route.ts:28-36`<br>`app/api/orders/route.ts:94-113`<br>`app/api/products/[id]/route.ts:72-80`<br>`app/api/products/route.ts:175-183` | [ ] |
| 5 | 70 | `app/styles/latest-category.css:530-564`<br>`app/styles/loading.css:118-152` | [ ] |
| 6 | 66 | `src/components/pages/catalogue-content.tsx:103-133`<br>`src/components/pages/category-content.tsx:87-121` | [ ] |
| 7 | 52 | `app/api/categories/latest/route.ts:84-109`<br>`app/page.tsx:74-99` | [ ] |
| 8 | 45 | `app/api/orders/[id]/status/route.ts:65-79`<br>`app/api/orders/[id]/tracking/route.ts:14-28`<br>`app/api/products/[id]/route.ts:58-72` | [ ] |
| 9 | 44 | `app/styles/admin.css:1063-1095`<br>`app/styles/loading.css:152-162` | [ ] |
| 10 | 43 | `app/catalogue/loading.tsx:18-32`<br>`app/category/[slug]/loading.tsx:30-57` | [ ] |
| 11 | 41 | `app/api/categories/[id]/route.ts:104-125`<br>`app/api/products/[id]/route.ts:141-159` | [ ] |
| 12 | 40 | `app/api/categories/[id]/route.ts:33-51`<br>`app/api/categories/[id]/route.ts:113-133` | [ ] |
| 13 | 38 | `app/admin/error.tsx:16-34`<br>`app/admin/not-found.tsx:4-22` | [ ] |
| 14 | 34 | `src/components/admin/AdminCataloguePanel.tsx:193-205`<br>`src/components/admin/AdminCategoriesPanel.tsx:60-80` | [ ] |
| 15 | 33 | `app/admin/page.tsx:36-43`<br>`app/admin/useAdminPageState.ts:110-134` | [ ] |
| 16 | 33 | `app/api/export/route.ts:25-36`<br>`scripts/export-to-excel.ts:37-57` | [ ] |
| 17 | 33 | `src/components/pages/catalogue-content.tsx:219-231`<br>`src/components/pages/category-content.tsx:192-211` | [ ] |
| 18 | 32 | `app/api/orders/[id]/status/route.ts:64-79`<br>`app/api/orders/[id]/tracking/route.ts:13-28` | [ ] |
| 19 | 32 | `app/styles/gallery.css:755-770`<br>`app/styles/gallery.css:861-876` | [ ] |
| 20 | 30 | `app/api/categories/[id]/route.ts:32-46`<br>`app/api/products/[id]/route.ts:57-71` | [ ] |
| 21 | 30 | `app/api/export/route.ts:127-141`<br>`scripts/export-to-excel.ts:119-133` | [ ] |
| 22 | 30 | `app/styles/admin.css:599-608`<br>`app/styles/products.css:342-351`<br>`app/styles/products.css:387-396` | [ ] |
| 23 | 30 | `src/components/admin/AdminCataloguePanel.tsx:9-23`<br>`src/lib/hooks/useAdminCatalogueController.ts:13-27` | [ ] |
| 24 | 24 | `app/api/categories/route.ts:104-115`<br>`app/api/products/route.ts:164-175` | [ ] |
| 25 | 24 | `app/api/create-order/route.ts:36-47`<br>`app/api/verify-payment/route.ts:23-34` | [ ] |
| 26 | 24 | `app/api/products/[id]/route.ts:112-123`<br>`app/api/products/route.ts:197-208` | [ ] |
| 27 | 24 | `scripts/generate-seed-from-excel.ts:230-241`<br>`scripts/import-production.ts:193-204` | [ ] |
| 28 | 22 | `src/components/pages/catalogue-content.tsx:257-266`<br>`src/components/pages/category-content.tsx:225-236` | [ ] |
| 29 | 21 | `app/api/export/route.ts:6-18`<br>`scripts/export-to-excel.ts:19-26` | [ ] |
| 30 | 21 | `src/lib/api/schemas.ts:81-87`<br>`src/lib/api/schemas.ts:108-114`<br>`src/lib/api/schemas.ts:280-286` | [ ] |
| 31 | 20 | `app/api/categories/[id]/route.ts:11-20`<br>`app/api/categories/route.ts:83-92` | [ ] |
| 32 | 20 | `app/order/page.tsx:256-265`<br>`app/order/page.tsx:268-277` | [ ] |
| 33 | 20 | `scripts/export-to-excel.ts:75-84`<br>`scripts/export-to-excel.ts:96-105` | [ ] |
| 34 | 20 | `src/lib/hooks/useAdminMutations.ts:46-55`<br>`src/lib/hooks/useAdminMutations.ts:70-79` | [ ] |
| 35 | 18 | `app/api/category/[slug]/products/route.ts:96-104`<br>`app/category/[slug]/page.tsx:132-140` | [ ] |
| 36 | 18 | `app/api/products/[id]/route.ts:72-80`<br>`app/api/products/route.ts:175-183` | [ ] |
| 37 | 18 | `app/catalogue/page.tsx:109-117`<br>`app/category/[slug]/page.tsx:146-154` | [ ] |
| 38 | 18 | `src/components/admin/PrintShippingLabelModal.tsx:56-64`<br>`src/components/admin/PrintShippingLabelModal.tsx:104-112` | [ ] |
| 39 | 18 | `src/lib/api/schemas.ts:81-89`<br>`src/lib/api/schemas.ts:280-288` | [ ] |
| 40 | 16 | `scripts/generate-seed-from-excel.ts:76-84`<br>`scripts/import-production.ts:59-65` | [ ] |
| 41 | 16 | `src/components/order/ConfirmationDetails.tsx:107-114`<br>`src/components/order/ConfirmationDetails.tsx:139-146` | [ ] |
| 42 | 14 | `scripts/generate-seed-from-excel.ts:3-9`<br>`scripts/import-production.ts:28-34` | [ ] |

### Clone families (32)

Related groups spanning the same files — extract a shared function/module once to clear all of them.

- [ ] **38 lines across 1 group** — `app/admin/error.tsx`, `app/admin/not-found.tsx`
- [ ] **33 lines across 1 group** — `app/admin/page.tsx`, `app/admin/useAdminPageState.ts`
- [ ] **92 lines across 1 group** — `app/api/auth/login/route.ts`, `app/api/categories/[id]/route.ts`, `app/api/categories/route.ts`, `app/api/create-order/route.ts`, `app/api/orders/[id]/status/route.ts`, `app/api/orders/[id]/tracking/route.ts`, `app/api/orders/route.ts`, `app/api/products/[id]/route.ts`, `app/api/products/route.ts`
- [ ] **83 lines across 1 group** — `app/api/auth/login/route.ts`, `app/api/categories/[id]/route.ts`, `app/api/categories/route.ts`, `app/api/orders/[id]/status/route.ts`, `app/api/orders/[id]/tracking/route.ts`, `app/api/orders/route.ts`, `app/api/products/[id]/route.ts`, `app/api/products/route.ts`
- [ ] **40 lines across 1 group** — `app/api/categories/[id]/route.ts`
- [ ] **20 lines across 1 group** — `app/api/categories/[id]/route.ts`, `app/api/categories/route.ts`
- [ ] **71 lines across 2 groups** — `app/api/categories/[id]/route.ts`, `app/api/products/[id]/route.ts`
- [ ] **52 lines across 1 group** — `app/api/categories/latest/route.ts`, `app/page.tsx`
- [ ] **24 lines across 1 group** — `app/api/categories/route.ts`, `app/api/products/route.ts`
- [ ] **18 lines across 1 group** — `app/api/category/[slug]/products/route.ts`, `app/category/[slug]/page.tsx`
- [ ] **24 lines across 1 group** — `app/api/create-order/route.ts`, `app/api/verify-payment/route.ts`
- [ ] **84 lines across 3 groups** — `app/api/export/route.ts`, `scripts/export-to-excel.ts`
- [ ] **32 lines across 1 group** — `app/api/orders/[id]/status/route.ts`, `app/api/orders/[id]/tracking/route.ts`
- [ ] **45 lines across 1 group** — `app/api/orders/[id]/status/route.ts`, `app/api/orders/[id]/tracking/route.ts`, `app/api/products/[id]/route.ts`
- [ ] **42 lines across 2 groups** — `app/api/products/[id]/route.ts`, `app/api/products/route.ts`
- [ ] **43 lines across 1 group** — `app/catalogue/loading.tsx`, `app/category/[slug]/loading.tsx`
- [ ] **18 lines across 1 group** — `app/catalogue/page.tsx`, `app/category/[slug]/page.tsx`
- [ ] **20 lines across 1 group** — `app/order/page.tsx`
- [ ] **142 lines across 2 groups** — `app/styles/admin.css`, `app/styles/loading.css`
- [ ] **30 lines across 1 group** — `app/styles/admin.css`, `app/styles/products.css`
- [ ] **32 lines across 1 group** — `app/styles/gallery.css`
- [ ] **70 lines across 1 group** — `app/styles/latest-category.css`, `app/styles/loading.css`
- [ ] **20 lines across 1 group** — `scripts/export-to-excel.ts`
- [ ] **54 lines across 3 groups** — `scripts/generate-seed-from-excel.ts`, `scripts/import-production.ts`
- [ ] **34 lines across 1 group** — `src/components/admin/AdminCataloguePanel.tsx`, `src/components/admin/AdminCategoriesPanel.tsx`
- [ ] **30 lines across 1 group** — `src/components/admin/AdminCataloguePanel.tsx`, `src/lib/hooks/useAdminCatalogueController.ts`
- [ ] **18 lines across 1 group** — `src/components/admin/PrintShippingLabelModal.tsx`
- [ ] **16 lines across 1 group** — `src/components/order/ConfirmationDetails.tsx`
- [ ] **248 lines across 1 group** — `src/components/order/OrderSummaryCard.tsx`, `src/components/ui/ShippingNudgePopup.tsx`
- [ ] **121 lines across 3 groups** — `src/components/pages/catalogue-content.tsx`, `src/components/pages/category-content.tsx`
- [ ] **39 lines across 2 groups** — `src/lib/api/schemas.ts`
- [ ] **20 lines across 1 group** — `src/lib/hooks/useAdminMutations.ts`

---

## 3. Complexity (96 functions above threshold)

Thresholds: cyclomatic > 20 · cognitive > 15 · CRAP ≥ 30 · unit size > 60 LOC.
Coverage model: **istanbul** — only 95/1742 functions matched by Istanbul coverage; unmatched CRAP scores are estimated from export references.

### 3.1 Large functions (90 total, > 60 LOC)

| Function | File:line | LOC | Status |
| --- | --- | --- | --- |
| `PrintShippingLabelModal` | `src/components/admin/PrintShippingLabelModal.tsx:34` | 728 | [ ] |
| `ProductFormModal` | `src/components/admin/ProductFormModal.tsx:39` | 394 | [ ] |
| `main` | `scripts/generate-seed-from-excel.ts:39` | 371 | [ ] |
| `main` | `scripts/import-production.ts:37` | 321 | [ ] |
| `<arrow>` | `src/components/layout/__tests__/Navbar.test.tsx:15` | 317 | [ ] |
| `OrderPage` | `app/order/page.tsx:354` | 314 | [ ] |
| `OrderDetailModal` | `src/components/order/OrderDetailModal.tsx:23` | 283 | [ ] |
| `<arrow>` | `src/components/order/__tests__/OrderDetailModal.test.tsx:27` | 270 | [ ] |
| `<arrow>` | `src/components/cart/__tests__/CartProvider.test.tsx:13` | 265 | [ ] |
| `ProductImageGallery` | `src/components/ui/ProductImageGallery.tsx:16` | 262 | [ ] |
| `CatalogueContent` | `src/components/pages/catalogue-content.tsx:30` | 260 | [ ] |
| `generateInvoice` | `src/components/order/ConfirmationDetails.tsx:32` | 227 | [ ] |
| `CategoryContent` | `src/components/pages/category-content.tsx:38` | 221 | [ ] |
| `AdminCataloguePanel` | `src/components/admin/AdminCataloguePanel.tsx:48` | 200 | [ ] |
| `Navbar` | `src/components/layout/Navbar.tsx:10` | 178 | [ ] |
| `AdminCategoriesPanel` | `src/components/admin/AdminCategoriesPanel.tsx:31` | 171 | [ ] |
| `OrderSummaryCard` | `src/components/order/OrderSummaryCard.tsx:35` | 164 | [ ] |
| `POST` | `app/api/orders/route.ts:80` | 152 | [ ] |
| `TrackPage` | `app/track/page.tsx:11` | 148 | [ ] |
| `exportToExcel` | `scripts/export-to-excel.ts:59` | 146 | [ ] |
| `AdminOrdersPanel` | `src/components/admin/AdminOrdersPanel.tsx:21` | 146 | [ ] |
| `useAdminCategoriesController` | `src/lib/hooks/useAdminCategoriesController.ts:48` | 145 | [ ] |
| `PaymentStep` | `app/order/page.tsx:150` | 143 | [ ] |
| `ProductDetailsContent` | `src/components/pages/ProductDetailsContent.tsx:31` | 143 | [ ] |
| `HomeContent` | `src/components/pages/home-content.tsx:13` | 140 | [ ] |
| `AdminPage` | `app/admin/page.tsx:32` | 131 | [ ] |
| `<arrow>` | `src/__tests__/api/orders.test.ts:131` | 129 | [ ] |
| `useAdminCatalogueController` | `src/lib/hooks/useAdminCatalogueController.ts:81` | 125 | [ ] |
| `LatestInEveryCategory` | `src/components/pages/LatestInEveryCategory.tsx:112` | 124 | [ ] |
| `CategoryPage` | `app/category/[slug]/page.tsx:67` | 123 | [ ] |
| `GET` | `app/api/category/[slug]/products/route.ts:21` | 118 | [ ] |
| `ProductDetailsPage` | `app/catalogue/[id]/page.tsx:60` | 118 | [ ] |
| `CataloguePage` | `app/catalogue/page.tsx:36` | 115 | [ ] |
| `GET` | `app/api/stats/route.ts:34` | 112 | [ ] |
| `useAdminPageState` | `app/admin/useAdminPageState.ts:28` | 109 | [ ] |
| `CartProvider` | `src/components/cart/CartProvider.tsx:67` | 109 | [ ] |
| `useAdminOrdersController` | `src/lib/hooks/useAdminOrdersController.ts:17` | 109 | [ ] |
| `<arrow>` | `src/__tests__/lib/redis-cache.redis-path.test.ts:16` | 106 | [ ] |
| `<arrow>` | `src/__tests__/api/products.test.ts:114` | 105 | [ ] |
| `<arrow>` | `src/__tests__/api/auth.login.test.ts:28` | 104 | [ ] |
| `ProductRow` | `src/components/admin/AdminCataloguePanel.tsx:273` | 104 | [ ] |
| `CategoryFormModal` | `src/components/admin/CategoryFormModal.tsx:17` | 104 | [ ] |
| `<arrow>` | `src/components/ui/__tests__/ToastProvider.test.tsx:5` | 102 | [ ] |
| `AdminLoginPage` | `app/admin/login/page.tsx:6` | 101 | [ ] |
| `<arrow>` | `src/__tests__/api/orders.status.test.ts:41` | 101 | [ ] |
| `<arrow>` | `src/components/admin/ProductFormModal.tsx:283` | 101 | [ ] |
| `ConfirmationDetails` | `src/components/order/ConfirmationDetails.tsx:260` | 101 | [ ] |
| `ProductCard` | `src/components/ui/ProductCard.tsx:45` | 98 | [ ] |
| `FallbackImage` | `src/components/ui/FallbackImage.tsx:42` | 97 | [ ] |
| `GET` | `app/api/categories/latest/route.ts:31` | 95 | [ ] |
| `ConfirmationPage` | `app/confirmation/[id]/page.tsx:28` | 94 | [ ] |
| `CategoryCard` | `src/components/pages/LatestInEveryCategory.tsx:17` | 94 | [ ] |
| `createMockRedis` | `src/__tests__/mocks/redis.ts:17` | 93 | [ ] |
| `<arrow>` | `src/lib/hooks/__tests__/useAdminOrdersController.test.ts:47` | 93 | [ ] |
| `order` | `app/api/orders/route.ts:116` | 92 | [ ] |
| `HomePage` | `app/page.tsx:22` | 88 | [ ] |
| `PUT` | `app/api/products/[id]/route.ts:57` | 87 | [ ] |
| `handleRazorpayPayment` | `app/order/page.tsx:478` | 87 | [ ] |
| `NavCartDropdown` | `src/components/layout/NavCartDropdown.tsx:25` | 87 | [ ] |
| `<arrow>` | `src/__tests__/lib/api-client.test.ts:12` | 82 | [ ] |
| `<arrow>` | `src/lib/hooks/__tests__/useAdminCatalogueController.test.ts:48` | 80 | [ ] |
| `GET` | `app/api/products/route.ts:52` | 79 | [ ] |
| `PUT` | `app/api/categories/[id]/route.ts:32` | 77 | [ ] |
| `ToastProvider` | `src/components/ui/ToastProvider.tsx:18` | 77 | [ ] |
| `<arrow>` | `src/components/ui/__tests__/ProductCard.test.tsx:20` | 76 | [ ] |
| `<arrow>` | `src/components/layout/__tests__/Footer.test.tsx:5` | 75 | [ ] |
| `sitemap` | `app/sitemap.ts:6` | 74 | [ ] |
| `GET` | `app/api/export/route.ts:180` | 73 | [ ] |
| `Footer` | `src/components/layout/Footer.tsx:49` | 72 | [ ] |
| `PATCH` | `app/api/orders/[id]/status/route.ts:64` | 71 | [ ] |
| `<arrow>` | `src/__tests__/lib/redis-cache.test.ts:9` | 71 | [ ] |
| `RootLayout` | `app/layout.tsx:110` | 69 | [ ] |
| `AdminTrackingModal` | `src/components/admin/AdminTrackingModal.tsx:11` | 69 | [ ] |
| `<arrow>` | `src/components/pages/__tests__/catalogue-pagination.test.tsx:71` | 69 | [ ] |
| `seedOrders` | `prisma/seed.ts:94` | 68 | [ ] |
| `<arrow>` | `src/lib/hooks/__tests__/useAdminHeaderActions.test.ts:25` | 68 | [ ] |
| `<arrow>` | `src/__tests__/lib/rate-limiter.test.ts:4` | 67 | [ ] |
| `apiFetch` | `src/lib/api/client.ts:83` | 67 | [ ] |
| `<arrow>` | `src/__tests__/api/orders.test.ts:64` | 66 | [ ] |
| `GET` | `app/api/categories/route.ts:17` | 65 | [ ] |
| `POST` | `app/api/create-order/route.ts:21` | 65 | [ ] |
| `<arrow>` | `src/__tests__/lib/cart-cookie.test.ts:10` | 65 | [ ] |
| `<arrow>` | `src/__tests__/api/categories.test.ts:94` | 64 | [ ] |
| `<arrow>` | `src/__tests__/api/orders.id.test.ts:21` | 64 | [ ] |
| `<arrow>` | `src/components/admin/PrintShippingLabelModal.tsx:465` | 64 | [ ] |
| `<arrow>` | `src/__tests__/api/products.test.ts:50` | 63 | [ ] |
| `POST` | `app/api/verify-payment/route.ts:17` | 62 | [ ] |
| `<arrow>` | `src/__tests__/api/products.id.test.ts:34` | 62 | [ ] |
| `ShippingNudgePopup` | `src/components/ui/ShippingNudgePopup.tsx:23` | 62 | [ ] |
| `<arrow>` | `src/lib/hooks/__tests__/useAdminMutations.test.tsx:34` | 62 | [ ] |

### 3.2 High-complexity functions (96)

Sorted by cyclomatic complexity (descending).

| Severity | Function | File:line | CC | Cog | LOC | CRAP | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 🟠 high | `OrderDetailModal` | `src/components/order/OrderDetailModal.tsx:23` | 31 | 37 | 283 | 31 | [ ] |
| 🔴 critical | `ProductRow` | `src/components/admin/AdminCataloguePanel.tsx:273` | 26 | 25 | 104 | 702 | [ ] |
| 🟠 high | `PrintShippingLabelModal` | `src/components/admin/PrintShippingLabelModal.tsx:34` | 22 | 37 | 728 | undefined | [ ] |
| 🟡 moderate | `GET` | `app/api/products/route.ts:52` | 21 | 20 | 79 | undefined | [ ] |
| 🔴 critical | `DeliveryDetailsStep` | `app/order/page.tsx:96` | 20 | 27 | 53 | 420 | [ ] |
| 🔴 critical | `<arrow>` | `scripts/import-production.ts:179` | 18 | 17 | 26 | 342 | [ ] |
| 🔴 critical | `main` | `scripts/import-production.ts:37` | 18 | 17 | 321 | 342 | [ ] |
| 🟠 high | `CatalogueContent` | `src/components/pages/catalogue-content.tsx:30` | 18 | 36 | 260 | undefined | [ ] |
| 🟡 moderate | `ProductCard` | `src/components/ui/ProductCard.tsx:45` | 18 | 17 | 98 | undefined | [ ] |
| 🔴 critical | `useAdminPageState` | `app/admin/useAdminPageState.ts:28` | 17 | 32 | 109 | 306 | [ ] |
| 🔴 critical | `<arrow>` | `scripts/generate-seed-from-excel.ts:217` | 17 | 16 | 25 | 306 | [ ] |
| 🟡 moderate | `apiFetch` | `src/lib/api/client.ts:83` | 17 | 19 | 67 | undefined | [ ] |
| 🔴 critical | `ProductDetailsPage` | `app/catalogue/[id]/page.tsx:60` | 17 | 15 | 118 | 306 | [ ] |
| 🟡 moderate | `PUT` | `app/api/categories/[id]/route.ts:32` | 16 | 18 | 77 | undefined | [ ] |
| 🟡 moderate | `PUT` | `app/api/products/[id]/route.ts:57` | 16 | 22 | 87 | undefined | [ ] |
| 🔴 critical | `AdminCataloguePanel` | `src/components/admin/AdminCataloguePanel.tsx:48` | 16 | 30 | 200 | 272 | [ ] |
| 🟠 high | `Navbar` | `src/components/layout/Navbar.tsx:10` | 15 | 26 | 178 | undefined | [ ] |
| 🔴 critical | `AdminPage` | `app/admin/page.tsx:32` | 15 | 15 | 131 | 240 | [ ] |
| 🔴 critical | `OrderPage` | `app/order/page.tsx:354` | 14 | 23 | 314 | 210 | [ ] |
| 🔴 critical | `CategoryContent` | `src/components/pages/category-content.tsx:38` | 14 | 23 | 221 | 210 | [ ] |
| 🔴 critical | `<arrow>` | `src/components/admin/ProductFormModal.tsx:283` | 13 | 13 | 101 | 182 | [ ] |
| 🔴 critical | `POST` | `app/api/create-order/route.ts:21` | 13 | 12 | 65 | 182 | [ ] |
| 🔴 critical | `main` | `scripts/generate-seed-from-excel.ts:39` | 12 | 18 | 371 | 156 | [ ] |
| 🔴 critical | `ProductImageGallery` | `src/components/ui/ProductImageGallery.tsx:16` | 12 | 24 | 262 | 156 | [ ] |
| 🔴 critical | `<arrow>` | `src/components/admin/AdminOrdersPanel.tsx:91` | 12 | 7 | 51 | 156 | [ ] |
| 🔴 critical | `PersonalDetailsStep` | `app/order/page.tsx:64` | 11 | 11 | 31 | 132 | [ ] |
| 🔴 critical | `<arrow>` | `src/components/admin/AdminCategoriesPanel.tsx:96` | 11 | 10 | 49 | 132 | [ ] |
| 🔴 critical | `buildProductColMap` | `scripts/generate-seed-from-excel.ts:89` | 11 | 10 | 15 | 132 | [ ] |
| 🔴 critical | `ProductDetailsContent` | `src/components/pages/ProductDetailsContent.tsx:31` | 11 | 15 | 143 | 132 | [ ] |
| 🔴 critical | `TrackPage` | `app/track/page.tsx:11` | 10 | 18 | 148 | 110 | [ ] |
| 🔴 critical | `ProductFormModal` | `src/components/admin/ProductFormModal.tsx:39` | 10 | 26 | 394 | 110 | [ ] |
| 🔴 critical | `CategoryFormModal` | `src/components/admin/CategoryFormModal.tsx:17` | 10 | 15 | 104 | 110 | [ ] |
| 🔴 critical | `<arrow>` | `src/components/order/OrderSummaryCard.tsx:84` | 10 | 9 | 53 | 110 | [ ] |
| 🔴 critical | `EndpointCard` | `app/docs/page.tsx:101` | 10 | 6 | 28 | 110 | [ ] |
| 🔴 critical | `CategoryCard` | `src/components/pages/LatestInEveryCategory.tsx:17` | 10 | 8 | 94 | 110 | [ ] |
| 🟡 moderate | `FallbackImage` | `src/components/ui/FallbackImage.tsx:42` | 9 | 24 | 97 | undefined | [ ] |
| 🟠 high | `OrderSummaryCard` | `src/components/order/OrderSummaryCard.tsx:35` | 9 | 15 | 164 | 90 | [ ] |
| 🟠 high | `<arrow>` | `scripts/import-production.ts:79` | 9 | 8 | 17 | 90 | [ ] |
| 🟠 high | `extractUrl` | `scripts/generate-seed-from-excel.ts:28` | 9 | 7 | 10 | 90 | [ ] |
| 🟠 high | `<arrow>` | `scripts/generate-seed-from-excel.ts:256` | 9 | 7 | 19 | 90 | [ ] |
| 🟠 high | `seedProducts` | `prisma/seed.ts:27` | 9 | 13 | 52 | 90 | [ ] |
| 🟠 high | `CatalogueProductLightbox` | `src/components/admin/AdminCataloguePanel.tsx:378` | 9 | 9 | 47 | 90 | [ ] |
| 🟠 high | `handleSearch` | `app/track/page.tsx:21` | 9 | 11 | 32 | 90 | [ ] |
| 🟠 high | `GET` | `app/api/export/route.ts:180` | 8 | 7 | 73 | 72 | [ ] |
| 🟠 high | `PaymentStep` | `app/order/page.tsx:150` | 8 | 13 | 143 | 72 | [ ] |
| 🟠 high | `<arrow>` | `scripts/generate-seed-from-excel.ts:116` | 8 | 7 | 15 | 72 | [ ] |
| 🟠 high | `handleAddToCart` | `src/components/pages/ProductDetailsContent.tsx:49` | 8 | 10 | 30 | 72 | [ ] |
| 🟠 high | `generateInvoice` | `src/components/order/ConfirmationDetails.tsx:32` | 8 | 8 | 227 | 72 | [ ] |
| 🟠 high | `generateMetadata` | `app/catalogue/[id]/page.tsx:29` | 8 | 7 | 30 | 72 | [ ] |
| 🟠 high | `handleKeyDown` | `src/components/ui/ProductImageGallery.tsx:61` | 8 | 9 | 19 | 72 | [ ] |
| 🟠 high | `LatestInEveryCategory` | `src/components/pages/LatestInEveryCategory.tsx:112` | 7 | 17 | 124 | 56 | [ ] |
| 🟠 high | `handleAdd` | `src/components/pages/category-content.tsx:86` | 7 | 6 | 31 | 56 | [ ] |
| 🟠 high | `retry` | `src/components/providers/QueryProvider.tsx:18` | 7 | 4 | 6 | 56 | [ ] |
| 🟠 high | `GET` | `app/api/cron/db-health/route.ts:20` | 7 | 7 | 31 | 56 | [ ] |
| 🟠 high | `handleSave` | `src/lib/hooks/useAdminCategoriesController.ts:108` | 7 | 7 | 28 | 56 | [ ] |
| 🟠 high | `POST` | `app/api/verify-payment/route.ts:17` | 7 | 6 | 62 | 56 | [ ] |
| 🟠 high | `CataloguePage` | `app/catalogue/page.tsx:36` | 7 | 6 | 115 | 56 | [ ] |
| 🟡 moderate | `AdminCategoriesPanel` | `src/components/admin/AdminCategoriesPanel.tsx:31` | 6 | 20 | 171 | 42 | [ ] |
| 🟡 moderate | `useAdminCategoriesController` | `src/lib/hooks/useAdminCategoriesController.ts:48` | 6 | 22 | 145 | 42 | [ ] |
| 🟡 moderate | `GET` | `app/api/products/recent/route.ts:10` | 6 | 5 | 40 | 42 | [ ] |
| 🟡 moderate | `proxy` | `proxy.ts:11` | 6 | 6 | 32 | 42 | [ ] |
| 🟡 moderate | `StepNavigation` | `app/order/page.tsx:294` | 6 | 13 | 28 | 42 | [ ] |
| 🟡 moderate | `handleRazorpayPayment` | `app/order/page.tsx:478` | 6 | 5 | 87 | 42 | [ ] |
| 🟡 moderate | `<arrow>` | `scripts/import-production.ts:245` | 6 | 5 | 12 | 42 | [ ] |
| 🟡 moderate | `<arrow>` | `scripts/import-production.ts:281` | 6 | 5 | 10 | 42 | [ ] |
| 🟡 moderate | `<arrow>` | `scripts/import-production.ts:316` | 6 | 5 | 13 | 42 | [ ] |
| 🟡 moderate | `schemaLabel` | `app/docs/page.tsx:62` | 6 | 5 | 6 | 42 | [ ] |
| 🟡 moderate | `<arrow>` | `scripts/generate-seed-from-excel.ts:180` | 6 | 5 | 11 | 42 | [ ] |
| 🟡 moderate | `<arrow>` | `scripts/generate-seed-from-excel.ts:293` | 6 | 5 | 10 | 42 | [ ] |
| 🟡 moderate | `FormSubmitButton` | `src/components/admin/ProductFormModal.tsx:434` | 6 | 7 | 8 | 42 | [ ] |
| 🟡 moderate | `PATCH` | `app/api/orders/[id]/tracking/route.ts:13` | 6 | 5 | 42 | 42 | [ ] |
| 🟡 moderate | `batchedFetch` | `app/api/export/route.ts:38` | 5 | 7 | 17 | 30 | [ ] |
| 🟡 moderate | `<arrow>` | `app/api/export/route.ts:64` | 5 | 7 | 12 | 30 | [ ] |
| 🟡 moderate | `<arrow>` | `app/page.tsx:76` | 5 | 4 | 24 | 30 | [ ] |
| 🟡 moderate | `CategoryPage` | `app/category/[slug]/page.tsx:67` | 5 | 4 | 123 | 30 | [ ] |
| 🟡 moderate | `runValidation` | `app/order/page.tsx:54` | 5 | 6 | 9 | 30 | [ ] |
| 🟡 moderate | `StickyCheckoutBar` | `app/order/page.tsx:323` | 5 | 11 | 30 | 30 | [ ] |
| 🟡 moderate | `handleSubmit` | `app/order/page.tsx:566` | 5 | 4 | 32 | 30 | [ ] |
| 🟡 moderate | `TrackOrderCard` | `src/components/track/TrackOrderCard.tsx:11` | 5 | 3 | 50 | 30 | [ ] |
| 🟡 moderate | `parseDate` | `scripts/import-production.ts:12` | 5 | 5 | 9 | 30 | [ ] |
| 🟡 moderate | `<arrow>` | `scripts/import-production.ts:55` | 5 | 4 | 11 | 30 | [ ] |
| 🟡 moderate | `<arrow>` | `scripts/import-production.ts:128` | 5 | 4 | 11 | 30 | [ ] |
| 🟡 moderate | `<arrow>` | `app/docs/page.tsx:83` | 5 | 4 | 14 | 30 | [ ] |
| 🟡 moderate | `renderSchema` | `app/docs/page.tsx:69` | 5 | 5 | 31 | 30 | [ ] |
| 🟡 moderate | `handleSubmit` | `app/admin/login/page.tsx:19` | 5 | 5 | 21 | 30 | [ ] |
| 🟡 moderate | `main` | `scripts/repro-catalogue.ts:5` | 5 | 4 | 38 | 30 | [ ] |
| 🟡 moderate | `parseDate` | `scripts/generate-seed-from-excel.ts:19` | 5 | 4 | 8 | 30 | [ ] |
| 🟡 moderate | `<arrow>` | `scripts/generate-seed-from-excel.ts:73` | 5 | 4 | 12 | 30 | [ ] |
| 🟡 moderate | `<arrow>` | `scripts/generate-seed-from-excel.ts:142` | 5 | 4 | 7 | 30 | [ ] |
| 🟡 moderate | `<arrow>` | `scripts/generate-seed-from-excel.ts:314` | 5 | 4 | 9 | 30 | [ ] |
| 🟡 moderate | `seedOrders` | `prisma/seed.ts:94` | 5 | 6 | 68 | 30 | [ ] |
| 🟡 moderate | `ConfirmationDetails` | `src/components/order/ConfirmationDetails.tsx:260` | 5 | 9 | 101 | 30 | [ ] |
| 🟡 moderate | `<arrow>` | `src/components/ui/Breadcrumbs.tsx:16` | 5 | 5 | 19 | 30 | [ ] |
| 🟡 moderate | `scroll` | `src/components/pages/LatestInEveryCategory.tsx:150` | 5 | 3 | 10 | 30 | [ ] |
| 🟡 moderate | `sitemap` | `app/sitemap.ts:6` | 5 | 4 | 74 | 30 | [ ] |
| 🟡 moderate | `useAdminCatalogueController` | `src/lib/hooks/useAdminCatalogueController.ts:81` | 4 | 18 | 125 | undefined | [ ] |

---

## 4. File Health Scores (193 files)

Sorted by triage concern (higher = address first). **Risk** is the max CRAP score (untested complexity); **MI** is the maintainability index (100 = best). **Risk flag** marks files where CRAP risk is the dominant concern.

| Rank | File | LOC | Fan-in | Fan-out | Dead % | Density | MI | Max CRAP | Funcs > thresh | Triage |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `src/components/admin/AdminCataloguePanel.tsx` | 436 | 2 | 4 | 0% | 0.19 | 87.9 | 702 | 3 | ⚠️ risk |
| 2 | `app/order/page.tsx` | 668 | 0 | 12 | 0% | 0.24 | 82.5 | 420 | 9 | ⚠️ risk |
| 3 | `scripts/import-production.ts` | 363 | 0 | 0 | 0% | 0.24 | 92.8 | 342 | 9 | ⚠️ risk |
| 4 | `app/admin/useAdminPageState.ts` | 137 | 2 | 7 | 0% | 0.25 | 84.2 | 306 | 1 | ⚠️ risk |
| 5 | `app/catalogue/[id]/page.tsx` | 178 | 0 | 4 | 0% | 0.17 | 88.5 | 306 | 2 | ⚠️ risk |
| 6 | `scripts/generate-seed-from-excel.ts` | 412 | 0 | 0 | 0% | 0.31 | 90.7 | 306 | 12 | ⚠️ risk |
| 7 | `app/admin/page.tsx` | 163 | 0 | 12 | 0% | 0.15 | 85.2 | 240 | 1 | ⚠️ risk |
| 8 | `src/components/pages/category-content.tsx` | 259 | 1 | 10 | 0% | 0.14 | 86.2 | 210 | 2 | ⚠️ risk |
| 9 | `src/components/admin/ProductFormModal.tsx` | 442 | 1 | 4 | 0% | 0.24 | 86.4 | 182 | 3 | ⚠️ risk |
| 10 | `app/api/create-order/route.ts` | 86 | 0 | 2 | 0% | 0.16 | 90.8 | 182 | 1 | ⚠️ risk |
| 11 | `src/components/admin/AdminOrdersPanel.tsx` | 167 | 1 | 4 | 0% | 0.16 | 88.8 | 156 | 1 | ⚠️ risk |
| 12 | `src/components/ui/ProductImageGallery.tsx` | 278 | 1 | 3 | 0% | 0.18 | 89.1 | 156 | 2 | ⚠️ risk |
| 13 | `src/components/pages/ProductDetailsContent.tsx` | 174 | 1 | 8 | 0% | 0.13 | 87.3 | 132 | 2 | ⚠️ risk |
| 14 | `src/components/admin/AdminCategoriesPanel.tsx` | 202 | 1 | 4 | 0% | 0.11 | 90.3 | 132 | 2 | ⚠️ risk |
| 15 | `app/track/page.tsx` | 159 | 0 | 6 | 0% | 0.16 | 87.4 | 110 | 2 | ⚠️ risk |
| 16 | `src/components/pages/LatestInEveryCategory.tsx` | 236 | 1 | 4 | 0% | 0.16 | 88.8 | 110 | 3 | ⚠️ risk |
| 17 | `src/components/admin/CategoryFormModal.tsx` | 121 | 1 | 3 | 0% | 0.15 | 90 | 110 | 1 | ⚠️ risk |
| 18 | `app/docs/page.tsx` | 219 | 0 | 1 | 0% | 0.21 | 90.9 | 110 | 4 | ⚠️ risk |
| 19 | `src/components/order/OrderSummaryCard.tsx` | 199 | 1 | 2 | 0% | 0.14 | 91.4 | 110 | 2 | ⚠️ risk |
| 20 | `prisma/seed.ts` | 182 | 0 | 1 | 0% | 0.12 | 93.6 | 90 | 2 | ⚠️ risk |
| 21 | `app/api/export/route.ts` | 253 | 0 | 2 | 0% | 0.18 | 90.2 | 72 | 3 | ⚠️ risk |
| 22 | `src/components/order/ConfirmationDetails.tsx` | 361 | 1 | 1 | 0% | 0.07 | 95.1 | 72 | 2 | ⚠️ risk |
| 23 | `src/lib/hooks/useAdminCategoriesController.ts` | 193 | 3 | 4 | 0% | 0.15 | 89.1 | 56 | 2 | ⚠️ risk |
| 24 | `app/catalogue/page.tsx` | 151 | 0 | 5 | 0% | 0.09 | 90.1 | 56 | 1 | ⚠️ risk |
| 25 | `src/components/providers/QueryProvider.tsx` | 52 | 1 | 0 | 0% | 0.31 | 90.7 | 56 | 1 | ⚠️ risk |
| 26 | `app/api/cron/db-health/route.ts` | 51 | 0 | 2 | 0% | 0.14 | 91.4 | 56 | 1 | ⚠️ risk |
| 27 | `app/api/verify-payment/route.ts` | 79 | 0 | 2 | 0% | 0.09 | 92.9 | 56 | 1 | ⚠️ risk |
| 28 | `app/api/orders/[id]/tracking/route.ts` | 55 | 0 | 4 | 0% | 0.13 | 89.7 | 42 | 1 | ⚠️ risk |
| 29 | `app/api/products/recent/route.ts` | 50 | 0 | 3 | 0% | 0.12 | 90.9 | 42 | 1 | ⚠️ risk |
| 30 | `proxy.ts` | 52 | 0 | 1 | 0% | 0.19 | 91.5 | 42 | 1 | ⚠️ risk |
| 31 | `src/components/order/OrderDetailModal.tsx` | 306 | 3 | 5 | 0% | 0.19 | 87.1 | 31 | 1 | ⚠️ risk |
| 32 | `app/category/[slug]/page.tsx` | 190 | 0 | 5 | 0% | 0.08 | 90.4 | 30 | 1 | ⚠️ risk |
| 33 | `scripts/repro-catalogue.ts` | 50 | 0 | 2 | 0% | 0.16 | 90.8 | 30 | 1 | ⚠️ risk |
| 34 | `src/components/track/TrackOrderCard.tsx` | 61 | 1 | 2 | 0% | 0.1 | 92.6 | 30 | 1 | ⚠️ risk |
| 35 | `app/page.tsx` | 110 | 0 | 2 | 0% | 0.08 | 93.2 | 30 | 1 | ⚠️ risk |
| 36 | `app/admin/login/page.tsx` | 107 | 0 | 1 | 0% | 0.12 | 93.6 | 30 | 1 | ⚠️ risk |
| 37 | `app/sitemap.ts` | 80 | 0 | 1 | 0% | 0.06 | 95.4 | 30 | 1 | ⚠️ risk |
| 38 | `src/components/ui/Breadcrumbs.tsx` | 39 | 3 | 0 | 0% | 0.15 | 96.5 | 30 | 1 | ⚠️ risk |
| 39 | `src/components/admin/PrintShippingLabelModal.tsx` | 762 | 1 | 1 | 0% | 0.14 | 93 | 22 | 0 | structure |
| 40 | `app/api/products/route.ts` | 220 | 1 | 7 | 0% | 0.22 | 85.1 | 21 | 0 | structure |
| 41 | `src/lib/razorpay.ts` | 35 | 1 | 1 | 0% | 0.26 | 91.8 | 20 | 0 | structure |
| 42 | `src/components/admin/AdminDeleteConfirm.tsx` | 59 | 1 | 1 | 0% | 0.12 | 93.6 | 20 | 0 | structure |
| 43 | `app/confirmation/[id]/page.tsx` | 122 | 0 | 2 | 0% | 0.05 | 94.1 | 20 | 0 | structure |
| 44 | `src/lib/image-loader.ts` | 44 | 0 | 0 | 0% | 0.09 | 97.6 | 20 | 0 | structure |
| 45 | `src/components/pages/catalogue-content.tsx` | 290 | 2 | 10 | 0% | 0.19 | 84.7 | 18 | 0 | structure |
| 46 | `src/components/ui/ProductCard.tsx` | 145 | 5 | 4 | 0% | 0.17 | 88.5 | 18 | 0 | structure |
| 47 | `src/lib/hooks/useAdminCatalogueController.ts` | 206 | 2 | 4 | 0% | 0.21 | 87.3 | 17 | 0 | structure |
| 48 | `src/lib/api/client.ts` | 150 | 5 | 1 | 0% | 0.23 | 90.3 | 17 | 0 | structure |
| 49 | `app/api/products/[id]/route.ts` | 176 | 1 | 5 | 0% | 0.26 | 85 | 16 | 0 | structure |
| 50 | `app/api/categories/[id]/route.ts` | 166 | 1 | 6 | 0% | 0.19 | 86.5 | 16 | 0 | structure |
| 51 | `src/components/layout/Navbar.tsx` | 188 | 2 | 3 | 0% | 0.25 | 87 | 15 | 0 | structure |
| 52 | `app/api/orders/[id]/status/route.ts` | 135 | 1 | 5 | 0% | 0.18 | 87.4 | 13 | 0 | structure |
| 53 | `lib/axiom/client.ts` | 31 | 1 | 1 | 67% | 0.1 | 82 | 12 | 0 | structure |
| 54 | `app/api/categories/route.ts` | 163 | 1 | 7 | 0% | 0.21 | 85.4 | 12 | 0 | structure |
| 55 | `app/api/category/[slug]/products/route.ts` | 139 | 1 | 3 | 0% | 0.13 | 90.6 | 12 | 0 | structure |
| 56 | `scripts/export-to-excel.ts` | 216 | 0 | 0 | 0% | 0.25 | 92.5 | 12 | 0 | structure |
| 57 | `src/components/admin/AdminTrackingModal.tsx` | 80 | 1 | 1 | 0% | 0.13 | 93.3 | 12 | 0 | structure |
| 58 | `src/components/admin/AdminChartsSection.tsx` | 110 | 1 | 1 | 0% | 0.1 | 94.2 | 12 | 0 | structure |
| 59 | `scripts/generate-fallow-report.mjs` | 290 | 0 | 0 | 0% | 0.09 | 97.3 | 12 | 0 | structure |
| 60 | `src/components/admin/AdminHeader.tsx` | 43 | 1 | 0 | 0% | 0.07 | 98.2 | 12 | 0 | structure |
| 61 | `app/api/track/route.ts` | 106 | 1 | 3 | 0% | 0.25 | 87 | 11 | 0 | structure |
| 62 | `src/lib/api/index.ts` | 305 | 7 | 2 | 0% | 0.17 | 90.5 | 10 | 0 | structure |
| 63 | `src/lib/csrf.ts` | 21 | 13 | 1 | 0% | 0.48 | 91.2 | 10 | 0 | structure |
| 64 | `src/lib/hooks/useAdminMutations.ts` | 225 | 9 | 3 | 0% | 0.26 | 86.7 | 9 | 0 | structure |
| 65 | `app/api/orders/route.ts` | 240 | 1 | 7 | 0% | 0.13 | 87.8 | 9 | 0 | structure |
| 66 | `src/components/ui/FallbackImage.tsx` | 139 | 9 | 1 | 0% | 0.09 | 94.5 | 9 | 0 | structure |
| 67 | `app/api/auth/login/route.ts` | 72 | 1 | 5 | 0% | 0.13 | 88.9 | 8 | 0 | structure |
| 68 | `app/api/stats/route.ts` | 146 | 1 | 3 | 0% | 0.15 | 90 | 8 | 0 | structure |
| 69 | `src/lib/useFocusTrap.ts` | 48 | 8 | 0 | 0% | 0.25 | 92.8 | 7.3 | 0 | structure |
| 70 | `src/components/layout/NavCartDropdown.tsx` | 112 | 1 | 2 | 0% | 0.15 | 91.1 | 7 | 0 | structure |
| 71 | `src/lib/prisma.ts` | 174 | 40 | 1 | 0% | 0.19 | 91.5 | 7 | 0 | structure |
| 72 | `src/components/ui/ToastProvider.tsx` | 101 | 16 | 0 | 0% | 0.22 | 93.4 | 6.1 | 0 | structure |
| 73 | `src/components/layout/Footer.tsx` | 121 | 2 | 1 | 0% | 0.06 | 95.4 | 6.1 | 0 | structure |
| 74 | `src/lib/hooks/useAdminOrdersController.ts` | 126 | 2 | 5 | 0% | 0.14 | 88.6 | 6 | 0 | structure |
| 75 | `src/lib/cache-invalidate.ts` | 49 | 10 | 1 | 0% | 0.22 | 90.8 | 6 | 0 | structure |
| 76 | `app/api/health/redis/route.ts` | 35 | 2 | 1 | 0% | 0.26 | 91.8 | 6 | 0 | structure |
| 77 | `src/lib/hooks/useAdminSession.ts` | 28 | 2 | 1 | 0% | 0.32 | 91.9 | 6 | 0 | structure |
| 78 | `src/components/admin/AdminStatsGrid.tsx` | 53 | 1 | 2 | 0% | 0.08 | 93.2 | 6 | 0 | structure |
| 79 | `src/components/pages/home-content.tsx` | 153 | 1 | 2 | 0% | 0.03 | 94.7 | 6 | 0 | structure |
| 80 | `src/components/order/CheckoutProgress.tsx` | 58 | 2 | 0 | 0% | 0.14 | 95.8 | 6 | 0 | structure |
| 81 | `src/lib/image-fallback.ts` | 69 | 1 | 0 | 0% | 0.14 | 95.8 | 6 | 0 | structure |
| 82 | `app/api/health/db/route.ts` | 15 | 0 | 1 | 0% | 0.13 | 96.1 | 6 | 0 | structure |
| 83 | `src/components/admin/AdminTabs.tsx` | 42 | 2 | 0 | 0% | 0.1 | 97.5 | 6 | 0 | structure |
| 84 | `app/error.tsx` | 41 | 0 | 0 | 0% | 0.07 | 98.3 | 6 | 0 | structure |
| 85 | `app/admin/error.tsx` | 55 | 0 | 0 | 0% | 0.05 | 98.5 | 6 | 0 | structure |
| 86 | `src/lib/redis-cache.ts` | 43 | 16 | 2 | 0% | 0.3 | 87.9 | 5 | 0 | structure |
| 87 | `src/components/cart/CartProvider.tsx` | 182 | 10 | 1 | 0% | 0.23 | 90.3 | 5 | 0 | structure |
| 88 | `src/lib/rate-limiter.ts` | 70 | 7 | 1 | 0% | 0.23 | 90.3 | 5 | 0 | structure |
| 89 | `app/api/categories/latest/route.ts` | 126 | 1 | 2 | 0% | 0.13 | 91.7 | 5 | 0 | structure |
| 90 | `src/lib/cart-cookie.ts` | 26 | 1 | 1 | 0% | 0.19 | 94.3 | 5 | 0 | structure |
| 91 | `src/lib/csrf-helpers.ts` | 15 | 1 | 0 | 0% | 0.6 | 94.6 | 5 | 0 | structure |
| 92 | `src/lib/utils.ts` | 25 | 7 | 0 | 0% | 0.28 | 95.8 | 5 | 0 | structure |
| 93 | `src/components/ui/SkeletonLoader.tsx` | 158 | 2 | 0 | 0% | 0.13 | 96.1 | 5 | 0 | structure |
| 94 | `src/lib/query-keys.ts` | 42 | 4 | 0 | 0% | 0.55 | 86.1 | 3 | 0 | structure |
| 95 | `src/lib/hooks/useAdminData.ts` | 108 | 5 | 3 | 0% | 0.2 | 88.5 | 4 | 0 | structure |
| 96 | `src/components/layout/__tests__/Navbar.test.tsx` | 350 | 0 | 2 | 0% | 0.21 | 89.3 | 4 | 0 | structure |
| 97 | `src/__tests__/lib/auth.test.ts` | 108 | 0 | 1 | 0% | 0.19 | 91.5 | 4 | 0 | structure |
| 98 | `app/api/orders/[id]/route.ts` | 44 | 1 | 2 | 0% | 0.09 | 93.2 | 4 | 0 | structure |
| 99 | `src/__tests__/mocks/redis.ts` | 110 | 3 | 0 | 0% | 0.21 | 93.7 | 4 | 0 | structure |
| 100 | `src/components/ui/StatusBadge.tsx` | 19 | 4 | 1 | 0% | 0.21 | 94.8 | 4 | 0 | structure |
| 101 | `lib/axiom/server.ts` | 28 | 7 | 1 | 0% | 0.14 | 94.9 | 4 | 0 | structure |
| 102 | `src/components/ui/StockBadge.tsx` | 16 | 3 | 0 | 0% | 0.25 | 97.6 | 4 | 0 | structure |
| 103 | `src/__tests__/api/categories.id.test.ts` | 132 | 0 | 7 | 0% | 0.11 | 88.4 | 1 | 0 | structure |
| 104 | `src/__tests__/api/categories.test.ts` | 158 | 0 | 7 | 0% | 0.11 | 88.4 | 1 | 0 | structure |
| 105 | `src/__tests__/api/products.test.ts` | 219 | 0 | 6 | 0% | 0.11 | 88.9 | 3 | 0 | structure |
| 106 | `src/__tests__/setup.ts` | 103 | 0 | 3 | 0% | 0.18 | 89.1 | 2 | 0 | structure |
| 107 | `src/components/pages/__tests__/catalogue-pagination.test.tsx` | 140 | 0 | 4 | 0% | 0.15 | 89.1 | 2 | 0 | structure |
| 108 | `src/lib/hooks/__tests__/useAdminHeaderActions.test.ts` | 93 | 0 | 3 | 0% | 0.18 | 89.1 | 1 | 0 | structure |
| 109 | `src/__tests__/api/track.test.ts` | 105 | 0 | 6 | 0% | 0.1 | 89.2 | 1 | 0 | structure |
| 110 | `src/__tests__/api/orders.id.test.ts` | 85 | 0 | 5 | 0% | 0.11 | 89.5 | 1 | 0 | structure |
| 111 | `src/__tests__/api/orders.status.test.ts` | 142 | 0 | 6 | 0% | 0.09 | 89.5 | 1 | 0 | structure |
| 112 | `src/__tests__/api/stats.test.ts` | 75 | 0 | 5 | 0% | 0.11 | 89.5 | 1 | 0 | structure |
| 113 | `src/__tests__/lib/cache-invalidate.test.ts` | 94 | 0 | 3 | 0% | 0.16 | 89.7 | 3 | 0 | structure |
| 114 | `src/__tests__/lib/constants.test.ts` | 69 | 0 | 1 | 0% | 0.25 | 89.7 | 2 | 0 | structure |
| 115 | `src/__tests__/lib/utils.test.ts` | 60 | 0 | 1 | 0% | 0.25 | 89.7 | 1 | 0 | structure |
| 116 | `src/lib/hooks/__tests__/useAdminCatalogueController.test.ts` | 128 | 0 | 3 | 0% | 0.16 | 89.7 | 1 | 0 | structure |
| 117 | `src/lib/hooks/__tests__/useAdminOrdersController.test.ts` | 140 | 0 | 3 | 0% | 0.16 | 89.7 | 1 | 0 | structure |
| 118 | `src/__tests__/api/orders.test.ts` | 260 | 0 | 6 | 0% | 0.08 | 89.8 | 1 | 0 | structure |
| 119 | `src/__tests__/api/products.id.test.ts` | 131 | 0 | 5 | 0% | 0.09 | 90.1 | 1 | 0 | structure |
| 120 | `src/__tests__/api/auth.me.test.ts` | 65 | 0 | 4 | 0% | 0.11 | 90.3 | 1 | 0 | structure |
| 121 | `src/lib/auth.ts` | 74 | 22 | 1 | 0% | 0.22 | 90.6 | 3 | 0 | structure |
| 122 | `src/components/ui/__tests__/StatusBadge.test.tsx` | 48 | 0 | 1 | 0% | 0.23 | 90.6 | 2 | 0 | structure |
| 123 | `src/__tests__/api/categories.latest.test.ts` | 81 | 0 | 4 | 0% | 0.1 | 90.6 | 1 | 0 | structure |
| 124 | `src/__tests__/lib/auth-fallback.test.ts` | 43 | 0 | 2 | 0% | 0.19 | 90.7 | 2 | 0 | structure |
| 125 | `src/__tests__/api/health.redis.connected.test.ts` | 47 | 0 | 3 | 0% | 0.13 | 90.8 | 1 | 0 | structure |
| 126 | `src/__tests__/lib/redis-cache.test.ts` | 94 | 0 | 2 | 0% | 0.16 | 90.8 | 1 | 0 | structure |
| 127 | `src/components/ui/__tests__/ProductCard.test.tsx` | 96 | 0 | 2 | 0% | 0.16 | 90.8 | 1 | 0 | structure |
| 128 | `app/layout.tsx` | 179 | 0 | 8 | 0% | 0.01 | 90.9 | 2 | 0 | structure |
| 129 | `src/__tests__/api/categories.slug.products.test.ts` | 99 | 0 | 4 | 0% | 0.09 | 90.9 | 1 | 0 | structure |
| 130 | `src/__tests__/lib/redis-cache.redis-path.test.ts` | 122 | 0 | 3 | 0% | 0.12 | 90.9 | 1 | 0 | structure |
| 131 | `src/lib/hooks/useAdminHeaderActions.ts` | 53 | 2 | 3 | 0% | 0.11 | 91.2 | 3 | 0 | structure |
| 132 | `src/lib/env.ts` | 23 | 4 | 0 | 0% | 0.61 | 91.6 | 3 | 0 | structure |
| 133 | `src/lib/cache.ts` | 19 | 2 | 0 | 0% | 0.32 | 96.4 | 3 | 0 | structure |
| 134 | `src/__tests__/utils/api-test.ts` | 25 | 10 | 0 | 0% | 0.12 | 98.2 | 3 | 0 | structure |
| 135 | `src/lib/constants.ts` | 128 | 11 | 0 | 0% | 0.02 | 99.4 | 3 | 0 | structure |
| 136 | `src/__tests__/api/auth.login.test.ts` | 132 | 0 | 4 | 0% | 0.08 | 91.2 | 2 | 0 | structure |
| 137 | `src/__tests__/api/auth.logout.test.ts` | 25 | 0 | 4 | 0% | 0.16 | 91.2 | 1 | 0 | structure |
| 138 | `src/components/ui/__tests__/StockBadge.test.tsx` | 51 | 0 | 1 | 0% | 0.2 | 91.2 | 1 | 0 | structure |
| 139 | `src/lib/hooks/__tests__/useAdminSession.test.ts` | 71 | 0 | 2 | 0% | 0.14 | 91.4 | 1 | 0 | structure |
| 140 | `src/components/cart/__tests__/CartProvider.test.tsx` | 278 | 0 | 1 | 0% | 0.19 | 91.5 | 2 | 0 | structure |
| 141 | `src/components/ui/__tests__/ToastProvider.test.tsx` | 107 | 0 | 1 | 0% | 0.19 | 91.5 | 2 | 0 | structure |
| 142 | `src/lib/hooks/useShippingNudge.ts` | 63 | 4 | 2 | 0% | 0.13 | 91.7 | 2 | 0 | structure |
| 143 | `src/__tests__/lib/rate-limiter.test.ts` | 71 | 0 | 1 | 0% | 0.18 | 91.8 | 2 | 0 | structure |
| 144 | `src/__tests__/lib/category-schemas.test.ts` | 93 | 0 | 1 | 0% | 0.18 | 91.8 | 1 | 0 | structure |
| 145 | `src/lib/hooks/__tests__/useAdminMutations.test.tsx` | 96 | 0 | 3 | 0% | 0.09 | 91.8 | 1 | 0 | structure |
| 146 | `src/components/ui/ShippingNudgePopup.tsx` | 85 | 3 | 3 | 0% | 0.08 | 92.1 | 2 | 0 | structure |
| 147 | `src/components/order/__tests__/CheckoutProgress.test.tsx` | 64 | 0 | 1 | 0% | 0.17 | 92.1 | 1 | 0 | structure |
| 148 | `src/__tests__/lib/query-keys.test.ts` | 51 | 0 | 1 | 0% | 0.16 | 92.4 | 1 | 0 | structure |
| 149 | `src/components/layout/__tests__/Footer.test.tsx` | 80 | 0 | 1 | 0% | 0.16 | 92.4 | 1 | 0 | structure |
| 150 | `src/__tests__/lib/openapi-spec.test.ts` | 63 | 0 | 1 | 0% | 0.14 | 93 | 1 | 0 | structure |
| 151 | `src/__tests__/lib/prisma-production.test.ts` | 28 | 0 | 1 | 0% | 0.25 | 93 | 1 | 0 | structure |
| 152 | `src/__tests__/lib/api-client.test.ts` | 94 | 0 | 1 | 0% | 0.12 | 93.6 | 2 | 0 | structure |
| 153 | `src/__tests__/lib/prisma.test.ts` | 33 | 0 | 1 | 0% | 0.18 | 93.7 | 1 | 0 | structure |
| 154 | `src/__tests__/lib/cart-cookie.test.ts` | 75 | 0 | 1 | 0% | 0.11 | 93.9 | 1 | 0 | structure |
| 155 | `app/api/auth/logout/route.ts` | 12 | 1 | 2 | 0% | 0.17 | 94.4 | 2 | 0 | structure |
| 156 | `src/lib/hooks/useTrackSearch.ts` | 12 | 1 | 2 | 0% | 0.17 | 94.4 | 2 | 0 | structure |
| 157 | `src/components/ui/ReturnsPolicyModal.tsx` | 62 | 2 | 1 | 0% | 0.08 | 94.8 | 2 | 0 | structure |
| 158 | `app/api/auth/me/route.ts` | 11 | 1 | 1 | 0% | 0.18 | 96 | 2 | 0 | structure |
| 159 | `app/api/docs/route.ts` | 12 | 0 | 1 | 0% | 0.08 | 96.7 | 2 | 0 | structure |
| 160 | `src/lib/hooks/useResponsivePageSize.ts` | 36 | 2 | 0 | 0% | 0.14 | 97 | 2 | 0 | structure |
| 161 | `app/admin/loading.tsx` | 42 | 0 | 0 | 0% | 0.1 | 97.5 | 2 | 0 | structure |
| 162 | `src/lib/domain-filter.ts` | 23 | 5 | 0 | 0% | 0.17 | 97.7 | 2 | 0 | structure |
| 163 | `app/order/loading.tsx` | 41 | 0 | 0 | 0% | 0.07 | 98.3 | 2 | 0 | structure |
| 164 | `app/catalogue/loading.tsx` | 36 | 0 | 0 | 0% | 0.06 | 98.7 | 2 | 0 | structure |
| 165 | `scripts/run-fallow-report.mjs` | 44 | 0 | 0 | 0% | 0.05 | 98.7 | 2 | 0 | structure |
| 166 | `src/components/ui/SectionHeader.tsx` | 22 | 4 | 0 | 0% | 0.09 | 98.8 | 2 | 0 | structure |
| 167 | `app/catalogue/[id]/loading.tsx` | 38 | 0 | 0 | 0% | 0.05 | 98.9 | 2 | 0 | structure |
| 168 | `src/components/ui/LoadingSpinner.tsx` | 27 | 2 | 0 | 0% | 0.07 | 98.9 | 2 | 0 | structure |
| 169 | `app/category/[slug]/loading.tsx` | 61 | 0 | 0 | 0% | 0.03 | 99.1 | 2 | 0 | structure |
| 170 | `app/admin/layout.tsx` | 17 | 0 | 0 | 0% | 0.06 | 99.4 | 2 | 0 | structure |
| 171 | `app/admin/not-found.tsx` | 36 | 0 | 0 | 0% | 0.03 | 99.4 | 2 | 0 | structure |
| 172 | `app/confirmation/[id]/loading.tsx` | 14 | 0 | 0 | 0% | 0.07 | 99.4 | 2 | 0 | structure |
| 173 | `app/docs/loading.tsx` | 9 | 0 | 0 | 0% | 0.11 | 99.4 | 2 | 0 | structure |
| 174 | `app/loading.tsx` | 11 | 0 | 0 | 0% | 0.09 | 99.4 | 2 | 0 | structure |
| 175 | `app/not-found.tsx` | 26 | 0 | 0 | 0% | 0.04 | 99.4 | 2 | 0 | structure |
| 176 | `app/order/layout.tsx` | 15 | 0 | 0 | 0% | 0.07 | 99.4 | 2 | 0 | structure |
| 177 | `app/track/layout.tsx` | 15 | 0 | 0 | 0% | 0.07 | 99.4 | 2 | 0 | structure |
| 178 | `app/track/loading.tsx` | 18 | 0 | 0 | 0% | 0.06 | 99.4 | 2 | 0 | structure |
| 179 | `src/components/ui/JsonLd.tsx` | 13 | 4 | 0 | 0% | 0.08 | 99.4 | 2 | 0 | structure |
| 180 | `next.config.ts` | 151 | 0 | 0 | 0% | 0.01 | 99.7 | 2 | 0 | structure |
| 181 | `src/__tests__/lib/sanitize.test.ts` | 28 | 0 | 1 | 0% | 0.18 | 94.2 | 1 | 0 | structure |
| 182 | `src/components/order/__tests__/OrderDetailModal.test.tsx` | 297 | 0 | 1 | 0% | 0.1 | 94.2 | 1 | 0 | structure |
| 183 | `src/components/ui/__tests__/SectionHeader.test.tsx` | 36 | 0 | 1 | 0% | 0.14 | 94.2 | 1 | 0 | structure |
| 184 | `src/components/ui/__tests__/LoadingSpinner.test.tsx` | 29 | 0 | 1 | 0% | 0.17 | 94.3 | 1 | 0 | structure |
| 185 | `src/components/ui/__tests__/AdminStatCard.test.tsx` | 25 | 0 | 1 | 0% | 0.16 | 94.8 | 1 | 0 | structure |
| 186 | `src/components/layout/FooterClientWrapper.tsx` | 18 | 1 | 1 | 0% | 0.17 | 95.4 | 1 | 0 | structure |
| 187 | `src/__tests__/api/health.redis.test.ts` | 14 | 0 | 1 | 0% | 0.14 | 96.1 | 1 | 0 | structure |
| 188 | `src/components/ui/Markdown.tsx` | 25 | 3 | 0 | 0% | 0.08 | 98.8 | 1 | 0 | structure |
| 189 | `lib/axiom/axiom.ts` | 31 | 2 | 0 | 0% | 0.03 | 99.4 | 1 | 0 | structure |
| 190 | `src/__tests__/mocks/prisma.ts` | 63 | 14 | 0 | 0% | 0.02 | 99.4 | 1 | 0 | structure |
| 191 | `src/components/ui/AdminStatCard.tsx` | 36 | 2 | 0 | 0% | 0.03 | 99.4 | 1 | 0 | structure |
| 192 | `src/lib/redis.ts` | 15 | 8 | 0 | 0% | 0.07 | 99.4 | 1 | 0 | structure |
| 193 | `src/lib/sanitize.ts` | 7 | 6 | 0 | 0% | 0.14 | 99.4 | 1 | 0 | structure |

---

## 5. Refactoring Targets (10)

Sorted by **ROI score** (quick-win efficiency, descending). **Pri** is the absolute priority weight (efficiency × effort) — a high effort can push a medium ROI target up.

| # | ROI | Pri | File | Category | Effort | Confidence | Recommendation | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 19.2 | 19.2 | `lib/axiom/client.ts` | remove dead code | low | high | Remove 2 unused exports to reduce surface area (67% dead) | [ ] |
| 2 | 12.2 | 24.3 | `src/lib/env.ts` | split high impact | medium | medium | Split high-impact file (23 LOC), 4 dependents amplify every change | [ ] |
| 3 | 10.2 | 30.7 | `src/lib/csrf.ts` | split high impact | high | medium | Split high-impact file (21 LOC), 13 dependents amplify every change | [ ] |
| 4 | 9.7 | 19.3 | `app/admin/useAdminPageState.ts` | extract complex functions | medium | high | Extract useAdminPageState (cognitive: 32) in 137-LOC file into smaller functions | [ ] |
| 5 | 9.4 | 18.7 | `src/components/pages/catalogue-content.tsx` | extract complex functions | medium | high | Extract CatalogueContent (cognitive: 36) in 290-LOC file into smaller functions | [ ] |
| 6 | 8.3 | 16.5 | `src/components/order/OrderDetailModal.tsx` | extract complex functions | medium | high | Extract OrderDetailModal (cognitive: 37) in 306-LOC file into smaller functions | [ ] |
| 7 | 7.5 | 22.5 | `src/lib/query-keys.ts` | split high impact | high | medium | Split high-impact file (42 LOC), 4 dependents amplify every change | [ ] |
| 8 | 6.9 | 13.7 | `src/components/admin/AdminCataloguePanel.tsx` | extract complex functions | medium | high | Extract AdminCataloguePanel (cognitive: 30) in 436-LOC file into smaller functions | [ ] |
| 9 | 4.7 | 9.3 | `scripts/generate-seed-from-excel.ts` | add test coverage | medium | high | 12 complex functions lack test coverage path, add tests before modifying | [ ] |
| 10 | 2.3 | 7 | `src/components/admin/PrintShippingLabelModal.tsx` | extract complex functions | high | high | Extract PrintShippingLabelModal (cognitive: 37) in 762-LOC file into smaller functions | [ ] |

### Target details

#### 19.2 — `lib/axiom/client.ts`

*ROI 19.2 · Pri 19.2*

- **Category:** remove dead code · **Effort:** low · **Confidence:** high
- **Recommendation:** Remove 2 unused exports to reduce surface area (67% dead)
- **Consumers:** `app/layout.tsx`
- **Unused exports:** `logger`, `useLogger`

#### 24.3 — `src/lib/env.ts`

*ROI 12.2 · Pri 24.3*

- **Category:** split high impact · **Effort:** medium · **Confidence:** medium
- **Recommendation:** Split high-impact file (23 LOC), 4 dependents amplify every change
- **Consumers:** `src/__tests__/lib/auth-fallback.test.ts`, `src/__tests__/setup.ts`, `src/lib/auth.ts`, `src/lib/prisma.ts`

#### 30.7 — `src/lib/csrf.ts`

*ROI 10.2 · Pri 30.7*

- **Category:** split high impact · **Effort:** high · **Confidence:** medium
- **Recommendation:** Split high-impact file (21 LOC), 13 dependents amplify every change
- **Consumers:** `app/api/auth/login/route.ts`, `app/api/auth/logout/route.ts`, `app/api/categories/[id]/route.ts`, `app/api/categories/route.ts`, `app/api/create-order/route.ts`

#### 19.3 — `app/admin/useAdminPageState.ts`

*ROI 9.7 · Pri 19.3*

- **Category:** extract complex functions · **Effort:** medium · **Confidence:** high
- **Recommendation:** Extract useAdminPageState (cognitive: 32) in 137-LOC file into smaller functions
- **Consumers:** `app/admin/page.tsx`, `src/components/admin/AdminCataloguePanel.tsx`

#### 18.7 — `src/components/pages/catalogue-content.tsx`

*ROI 9.4 · Pri 18.7*

- **Category:** extract complex functions · **Effort:** medium · **Confidence:** high
- **Recommendation:** Extract CatalogueContent (cognitive: 36) in 290-LOC file into smaller functions
- **Consumers:** `app/catalogue/page.tsx`, `src/components/pages/__tests__/catalogue-pagination.test.tsx`

#### 16.5 — `src/components/order/OrderDetailModal.tsx`

*ROI 8.3 · Pri 16.5*

- **Category:** extract complex functions · **Effort:** medium · **Confidence:** high
- **Recommendation:** Extract OrderDetailModal (cognitive: 37) in 306-LOC file into smaller functions
- **Consumers:** `app/admin/page.tsx`, `app/track/page.tsx`, `src/components/order/__tests__/OrderDetailModal.test.tsx`

#### 22.5 — `src/lib/query-keys.ts`

*ROI 7.5 · Pri 22.5*

- **Category:** split high impact · **Effort:** high · **Confidence:** medium
- **Recommendation:** Split high-impact file (42 LOC), 4 dependents amplify every change
- **Consumers:** `src/__tests__/lib/query-keys.test.ts`, `src/lib/hooks/__tests__/useAdminMutations.test.tsx`, `src/lib/hooks/useAdminData.ts`, `src/lib/hooks/useAdminMutations.ts`

#### 13.7 — `src/components/admin/AdminCataloguePanel.tsx`

*ROI 6.9 · Pri 13.7*

- **Category:** extract complex functions · **Effort:** medium · **Confidence:** high
- **Recommendation:** Extract AdminCataloguePanel (cognitive: 30) in 436-LOC file into smaller functions
- **Consumers:** `app/admin/page.tsx`, `src/components/admin/ProductFormModal.tsx`

#### 9.3 — `scripts/generate-seed-from-excel.ts`

*ROI 4.7 · Pri 9.3*

- **Category:** add test coverage · **Effort:** medium · **Confidence:** high
- **Recommendation:** 12 complex functions lack test coverage path, add tests before modifying

#### 7 — `src/components/admin/PrintShippingLabelModal.tsx`

*ROI 2.3 · Pri 7*

- **Category:** extract complex functions · **Effort:** high · **Confidence:** high
- **Recommendation:** Extract PrintShippingLabelModal (cognitive: 37) in 762-LOC file into smaller functions
- **Consumers:** `src/components/order/OrderDetailModal.tsx`


---

## Appendix: Re-running

```bash
npm run fallow:report                # full analysis (dead-code + dupes + health) -> docs/fallow-report.md
npx fallow health --format json --top 200 > fallow-health.json
npx fallow dead-code --format json > fallow-dead.json
npx fallow dupes --format json > fallow-dupes.json
```

Suppression markers (use sparingly, and only after fixing what you can):

| Marker | Scope |
| --- | --- |
| `// fallow-ignore-next-line complexity` | above a function |
| `// fallow-ignore-next-line unused-export` / `unused-type` | above an export |
| `// fallow-ignore-file unused-file` | top of a file |
