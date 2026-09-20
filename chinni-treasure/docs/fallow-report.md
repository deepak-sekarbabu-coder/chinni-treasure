# Fallow Analysis Report — Chinni Treasure

> **Generated:** 2026-09-16 · **Fallow version:** 3.26.0 (schema 11) · **Command:** `npm run fallow:report`
> Raw JSON sources: `fallow-health.json`, `fallow-dead.json`, `fallow-dupes.json` (regenerate with `npx fallow <analysis> --format json`).

## Summary

| Metric | Value |
| --- | --- |
| **Health score** | **88 / 100 (grade A)** |
| Maintainability index | 92.3 (good) |
| Files analyzed | 293 |
| Lines of code | 44,410 |
| Functions analyzed | 2,426 |
| Functions above complexity threshold | **114** (🔴 37 critical · 🟠 25 high · 🟡 52 moderate) |
| Functions > 60 LOC | 47.8 per 1k functions |
| Dead files | 0 (0%) |
| Dead exports | 5 (1.1%) |
| Duplicated lines | 1,031 (3%) across 35 files |
| Circular dependencies | 0 |
| Unused dependencies | 0 |
| Change hotspots (6 mo) | 0 |
| Avg cyclomatic | 1.9 (p90: 4) |
| Istanbul coverage matched | 69 / 2426 functions (2.8%) |

**Health score penalties:** dead_exports −0.2 · unit_size −10 · coupling −1.8

**Exit status:** analysis fails (non-zero) when any category has issues: dead-code (5), dupes (28 groups), health (114 above threshold).

## Progress Tracker

Check off categories as they are resolved (fallow will confirm with a clean exit):

- [ ] **Dead code** — 23 issues (3 files, 10 exports, 5 types, 1 test-only dep, 4 stale suppressions)
- [ ] **Duplication** — 42 clone groups / 100 instances, 1,031 lines (3.0%)
- [ ] **Complexity** — 114 functions above threshold (37 critical, 25 high, 52 moderate)
- [ ] **File health** — 200 files scored; resolve the highest-risk files first
- [ ] **Refactoring targets** — 9 prioritized recommendations

---

## 1. Dead Code (5 issues)

### 1.1 Unused files (0)

Files not reachable from any entry point. Verify each is truly obsolete before deleting.

| File | Status |
| --- | --- |

### 1.2 Unused exports (5)

Exported symbols with no known consumers.

| File | Export | Line | Status |
| --- | --- | --- | --- |
| `src/lib/api/schemas.ts` | `PageMetaSchema` | 49 | [ ] |
| `src/lib/api/schemas.ts` | `CatalogueProductSchema` | 104 | [ ] |
| `src/lib/catalogue-cache.ts` | `catIndexCache` | 24 | [ ] |
| `src/lib/catalogue-cache.ts` | `catLatestCache` | 26 | [ ] |
| `src/lib/razorpay-server.ts` | `fetchRazorpayPayment` | 108 | [ ] |

### 1.3 Unused type exports (0)

| File | Type | Line | Status |
| --- | --- | --- | --- |

### 1.4 Test-only production dependencies (0)

Consider moving to `devDependencies`.

| Package | File | Status |
| --- | --- | --- |

### 1.5 Stale suppressions (0)

Suppression comments that no longer match any issue (mostly a typo: `unused-files` → `unused-file`).

| File | Line | Issue kind | Status |
| --- | --- | --- | --- |

---

## 2. Duplication (28 clone groups · 1,031 lines · 3.0%)

Identical code blocks detected via suffix-array analysis. Groups with the most lines are the highest-value extraction targets.

> **Note:** some groups overlap — e.g. rows 3–4 are the same duplicated CSRF-check + rate-limit block spread across API routes, detected at different token granularities. Fixing the shared block clears both.

| # | Lines | Locations | Status |
| --- | --- | --- | --- |
| 1 | 190 | `src/components/admin/AdminCategoriesPanel.tsx:29-202`<br>`src/components/admin/useAdminCategoriesPanel.ts:26-41` | [ ] |
| 2 | 98 | `app/styles/admin.css:1356-1404`<br>`app/styles/loading.css:52-100` | [ ] |
| 3 | 70 | `app/styles/latest-category.css:538-572`<br>`app/styles/loading.css:118-152` | [ ] |
| 4 | 62 | `src/components/pages/catalogue-content.tsx:144-176`<br>`src/components/pages/category-content.tsx:83-111` | [ ] |
| 5 | 53 | `src/lib/order-intake.ts:78-95`<br>`src/lib/order-intake.ts:381-415` | [ ] |
| 6 | 44 | `app/styles/admin.css:1404-1436`<br>`app/styles/loading.css:152-162` | [ ] |
| 7 | 43 | `app/catalogue/loading.tsx:18-32`<br>`app/category/[slug]/loading.tsx:30-57` | [ ] |
| 8 | 42 | `src/components/layout/NavCartDropdown.tsx:81-102`<br>`src/components/order/OrderSummaryCard.tsx:134-153` | [ ] |
| 9 | 38 | `app/admin/error.tsx:16-34`<br>`app/admin/not-found.tsx:4-22` | [ ] |
| 10 | 33 | `src/components/pages/catalogue-content.tsx:282-294`<br>`src/components/pages/category-content.tsx:195-214` | [ ] |
| 11 | 32 | `app/styles/gallery.css:756-771`<br>`app/styles/gallery.css:862-877` | [ ] |
| 12 | 32 | `src/lib/hooks/useAdminCatalogueController.ts:13-28`<br>`src/types/product-form.ts:1-16` | [ ] |
| 13 | 30 | `app/styles/admin.css:795-804`<br>`app/styles/products.css:395-404`<br>`app/styles/products.css:440-449` | [ ] |
| 14 | 28 | `src/components/pages/GiftBoxModal.tsx:231-244`<br>`src/components/pages/GiftBoxSelector.tsx:148-161` | [ ] |
| 15 | 27 | `src/components/pages/catalogue-content.tsx:176-188`<br>`src/components/pages/category-content.tsx:111-124` | [ ] |
| 16 | 24 | `src/components/ui/ProductCard.tsx:24-35`<br>`src/lib/product-read.ts:32-43` | [ ] |
| 17 | 21 | `src/lib/api/schemas.ts:80-86`<br>`src/lib/api/schemas.ts:104-110`<br>`src/lib/api/schemas.ts:286-292` | [ ] |
| 18 | 20 | `app/order/page.tsx:217-226`<br>`app/order/page.tsx:229-238` | [ ] |
| 19 | 18 | `src/lib/api/schemas.ts:80-88`<br>`src/lib/api/schemas.ts:286-294` | [ ] |
| 20 | 18 | `src/components/admin/PrintShippingLabelModal.tsx:46-54`<br>`src/components/admin/PrintShippingLabelModal.tsx:94-102` | [ ] |
| 21 | 18 | `src/components/admin/AdminCataloguePanel.tsx:464-472`<br>`src/components/admin/table/columns.catalogue.tsx:128-136` | [ ] |
| 22 | 18 | `app/api/categories/[id]/route.ts:24-31`<br>`app/api/categories/[id]/route.ts:72-81` | [ ] |
| 23 | 17 | `prisma/seed-data.ts:1210-1222`<br>`src/lib/excel-export.ts:22-25` | [ ] |
| 24 | 16 | `src/lib/pdf-documents.ts:104-111`<br>`src/lib/pdf-documents.ts:136-143` | [ ] |
| 25 | 16 | `src/components/admin/AdminCataloguePanel.tsx:36-43`<br>`src/components/admin/useAdminCataloguePanel.ts:40-47` | [ ] |
| 26 | 16 | `scripts/open-lighthouse-report.mjs:28-36`<br>`scripts/run-lighthouse.mjs:320-326` | [ ] |
| 27 | 15 | `src/components/pages/GiftBoxModal.tsx:194-201`<br>`src/components/pages/GiftBoxSelector.tsx:116-122` | [ ] |
| 28 | 10 | `scripts/generate-seed-from-excel.ts:286-290`<br>`scripts/generate-seed-from-excel.ts:341-345` | [ ] |

### Clone families (23)

Related groups spanning the same files — extract a shared function/module once to clear all of them.

- [ ] **38 lines across 1 group** — `app/admin/error.tsx`, `app/admin/not-found.tsx`
- [ ] **18 lines across 1 group** — `app/api/categories/[id]/route.ts`
- [ ] **43 lines across 1 group** — `app/catalogue/loading.tsx`, `app/category/[slug]/loading.tsx`
- [ ] **20 lines across 1 group** — `app/order/page.tsx`
- [ ] **142 lines across 2 groups** — `app/styles/admin.css`, `app/styles/loading.css`
- [ ] **30 lines across 1 group** — `app/styles/admin.css`, `app/styles/products.css`
- [ ] **32 lines across 1 group** — `app/styles/gallery.css`
- [ ] **70 lines across 1 group** — `app/styles/latest-category.css`, `app/styles/loading.css`
- [ ] **17 lines across 1 group** — `prisma/seed-data.ts`, `src/lib/excel-export.ts`
- [ ] **10 lines across 1 group** — `scripts/generate-seed-from-excel.ts`
- [ ] **16 lines across 1 group** — `scripts/open-lighthouse-report.mjs`, `scripts/run-lighthouse.mjs`
- [ ] **18 lines across 1 group** — `src/components/admin/AdminCataloguePanel.tsx`, `src/components/admin/table/columns.catalogue.tsx`
- [ ] **16 lines across 1 group** — `src/components/admin/AdminCataloguePanel.tsx`, `src/components/admin/useAdminCataloguePanel.ts`
- [ ] **190 lines across 1 group** — `src/components/admin/AdminCategoriesPanel.tsx`, `src/components/admin/useAdminCategoriesPanel.ts`
- [ ] **18 lines across 1 group** — `src/components/admin/PrintShippingLabelModal.tsx`
- [ ] **42 lines across 1 group** — `src/components/layout/NavCartDropdown.tsx`, `src/components/order/OrderSummaryCard.tsx`
- [ ] **43 lines across 2 groups** — `src/components/pages/GiftBoxModal.tsx`, `src/components/pages/GiftBoxSelector.tsx`
- [ ] **122 lines across 3 groups** — `src/components/pages/catalogue-content.tsx`, `src/components/pages/category-content.tsx`
- [ ] **24 lines across 1 group** — `src/components/ui/ProductCard.tsx`, `src/lib/product-read.ts`
- [ ] **39 lines across 2 groups** — `src/lib/api/schemas.ts`
- [ ] **32 lines across 1 group** — `src/lib/hooks/useAdminCatalogueController.ts`, `src/types/product-form.ts`
- [ ] **53 lines across 1 group** — `src/lib/order-intake.ts`
- [ ] **16 lines across 1 group** — `src/lib/pdf-documents.ts`

---

## 3. Complexity (114 functions above threshold)

Thresholds: cyclomatic > 20 · cognitive > 15 · CRAP ≥ 30 · unit size > 60 LOC.
Coverage model: **istanbul** — only 69/2426 functions matched by Istanbul coverage; unmatched CRAP scores are estimated from export references.

### 3.1 Large functions (116 total, > 60 LOC)

| Function | File:line | LOC | Status |
| --- | --- | --- | --- |
| `<arrow>` | `src/__tests__/api/orders.test.ts:185` | 612 | [ ] |
| `PrintShippingLabelModal` | `src/components/admin/PrintShippingLabelModal.tsx:26` | 520 | [ ] |
| `ProductFormModal` | `src/components/admin/ProductFormModal.tsx:39` | 448 | [ ] |
| `main` | `scripts/generate-seed-from-excel.ts:39` | 431 | [ ] |
| `CatalogueContent` | `src/components/pages/catalogue-content.tsx:30` | 360 | [ ] |
| `<arrow>` | `src/__tests__/components/layout/Navbar.test.tsx:15` | 340 | [ ] |
| `<arrow>` | `src/__tests__/components/cart/CartProvider.test.tsx:19` | 318 | [ ] |
| `OrderPage` | `app/order/page.tsx:264` | 283 | [ ] |
| `OrderDetailModal` | `src/components/order/OrderDetailModal.tsx:29` | 282 | [ ] |
| `<arrow>` | `src/__tests__/components/pages/GiftBoxModal.test.tsx:26` | 272 | [ ] |
| `<arrow>` | `src/__tests__/components/order/OrderDetailModal.test.tsx:27` | 270 | [ ] |
| `ProductImageGallery` | `src/components/ui/ProductImageGallery.tsx:16` | 262 | [ ] |
| `ShippingLabel` | `src/components/admin/ShippingLabel.tsx:30` | 239 | [ ] |
| `GiftBoxModal` | `src/components/pages/GiftBoxModal.tsx:39` | 238 | [ ] |
| `generateInvoice` | `src/lib/pdf-documents.ts:29` | 238 | [ ] |
| `CategoryContent` | `src/components/pages/category-content.tsx:38` | 232 | [ ] |
| `AdminCataloguePanel` | `src/components/admin/AdminCataloguePanel.tsx:47` | 230 | [ ] |
| `placeOrder` | `src/lib/order-intake.ts:124` | 228 | [ ] |
| `order` | `src/lib/order-intake.ts:149` | 194 | [ ] |
| `createCatalogueColumns` | `src/components/admin/table/columns.catalogue.tsx:76` | 189 | [ ] |
| `OrderSummaryCard` | `src/components/order/OrderSummaryCard.tsx:31` | 185 | [ ] |
| `Navbar` | `src/components/layout/Navbar.tsx:10` | 182 | [ ] |
| `ProductDetailsContent` | `src/components/pages/ProductDetailsContent.tsx:35` | 173 | [ ] |
| `GiftBoxSelector` | `src/components/pages/GiftBoxSelector.tsx:29` | 168 | [ ] |
| `AdminCategoriesPanel` | `src/components/admin/AdminCategoriesPanel.tsx:39` | 164 | [ ] |
| `main` | `scripts/run-lighthouse.mjs:343` | 161 | [ ] |
| `TrackPage` | `app/track/page.tsx:11` | 157 | [ ] |
| `CartProvider` | `src/components/cart/CartProvider.tsx:147` | 155 | [ ] |
| `PaymentStep` | `app/order/page.tsx:111` | 152 | [ ] |
| `AdminOrdersPanel` | `src/components/admin/AdminOrdersPanel.tsx:109` | 146 | [ ] |
| `useAdminCategoriesController` | `src/lib/hooks/useAdminCategoriesController.ts:48` | 145 | [ ] |
| `AdminPage` | `app/admin/page.tsx:36` | 142 | [ ] |
| `HomeContent` | `src/components/pages/home-content.tsx:18` | 141 | [ ] |
| `Particles` | `src/components/pages/HeroParticles3D.tsx:29` | 134 | [ ] |
| `CatalogueCards` | `src/components/admin/AdminCataloguePanel.tsx:378` | 133 | [ ] |
| `<arrow>` | `src/__tests__/api/orders.status.test.ts:40` | 130 | [ ] |
| `<arrow>` | `src/__tests__/components/ui/ComplementaryGiftPopup.test.tsx:11` | 127 | [ ] |
| `useAdminCatalogueController` | `src/lib/hooks/useAdminCatalogueController.ts:84` | 126 | [ ] |
| `LatestInEveryCategory` | `src/components/pages/LatestInEveryCategory.tsx:114` | 124 | [ ] |
| `<arrow>` | `src/__tests__/components/pages/catalogue-pagination.test.tsx:72` | 121 | [ ] |
| `<arrow>` | `src/__tests__/components/ui/ShippingNudgePopup.test.tsx:11` | 118 | [ ] |
| `ProductDetailsPage` | `app/catalogue/[id]/page.tsx:66` | 112 | [ ] |
| `createCategoryColumns` | `src/components/admin/table/columns.categories.tsx:15` | 111 | [ ] |
| `useAdminOrdersController` | `src/lib/hooks/useAdminOrdersController.ts:20` | 111 | [ ] |
| `GET` | `app/api/products/route.ts:39` | 109 | [ ] |
| `NavCartDropdown` | `src/components/layout/NavCartDropdown.tsx:28` | 108 | [ ] |
| `ConfirmationDetails` | `src/components/order/ConfirmationDetails.tsx:10` | 108 | [ ] |
| `<arrow>` | `src/__tests__/lib/redis-cache.redis-path.test.ts:16` | 106 | [ ] |
| `AdminLoginPage` | `app/admin/login/page.tsx:6` | 105 | [ ] |
| `<arrow>` | `src/__tests__/lib/hooks/useShippingNudge.test.ts:10` | 105 | [ ] |
| `<arrow>` | `src/__tests__/api/auth.login.test.ts:28` | 104 | [ ] |
| `CategoryFormModal` | `src/components/admin/CategoryFormModal.tsx:17` | 104 | [ ] |
| `<arrow>` | `src/__tests__/lib/cart-cookie.test.ts:36` | 103 | [ ] |
| `<arrow>` | `src/components/admin/AdminCataloguePanel.tsx:405` | 103 | [ ] |
| `<arrow>` | `src/__tests__/components/ui/ToastProvider.test.tsx:5` | 102 | [ ] |
| `ComplementaryGiftPopup` | `src/components/ui/ComplementaryGiftPopup.tsx:26` | 102 | [ ] |
| `<arrow>` | `src/__tests__/api/orders.test.ts:83` | 101 | [ ] |
| `<arrow>` | `src/__tests__/lib/checkout-fields.test.ts:21` | 101 | [ ] |
| `<arrow>` | `src/components/admin/ProductFormModal.tsx:336` | 101 | [ ] |
| `<arrow>` | `src/__tests__/lib/order-intake.test.ts:79` | 98 | [ ] |
| `ProductCard` | `src/components/ui/ProductCard.tsx:47` | 98 | [ ] |
| `CategoryCards` | `src/components/admin/AdminCategoriesPanel.tsx:218` | 97 | [ ] |
| `ConfirmationPage` | `app/confirmation/[id]/page.tsx:28` | 96 | [ ] |
| `CategoryCard` | `src/components/pages/LatestInEveryCategory.tsx:18` | 95 | [ ] |
| `<arrow>` | `src/__tests__/lib/pricing.test.ts:10` | 94 | [ ] |
| `seedOrders` | `prisma/seed.ts:102` | 93 | [ ] |
| `<arrow>` | `src/__tests__/lib/hooks/useAdminOrdersController.test.ts:45` | 93 | [ ] |
| `createMockRedis` | `src/__tests__/mocks/redis.ts:17` | 93 | [ ] |
| `<arrow>` | `src/__tests__/api/orders.test.ts:282` | 91 | [ ] |
| `<arrow>` | `src/__tests__/lib/order-fulfilment.test.ts:103` | 91 | [ ] |
| `handleRazorpayPayment` | `app/order/page.tsx:366` | 89 | [ ] |
| `<arrow>` | `src/__tests__/components/admin/table/AdminDataTable.test.tsx:36` | 89 | [ ] |
| `<arrow>` | `src/__tests__/lib/cart-cookie.test.ts:140` | 89 | [ ] |
| `AdminDataTable` | `src/components/admin/table/AdminDataTable.tsx:29` | 88 | [ ] |
| `OrdersChart` | `src/components/admin/AdminChartsSection.tsx:50` | 86 | [ ] |
| `RootLayout` | `app/layout.tsx:112` | 85 | [ ] |
| `CataloguePage` | `app/catalogue/page.tsx:39` | 82 | [ ] |
| `<arrow>` | `src/__tests__/lib/api-client.test.ts:12` | 82 | [ ] |
| `<arrow>` | `src/__tests__/lib/hooks/useAdminCatalogueController.test.ts:48` | 80 | [ ] |
| `useAddToCart` | `src/lib/hooks/useAddToCart.ts:36` | 80 | [ ] |
| `analyzeRun` | `scripts/analyze-lighthouse.mjs:121` | 79 | [ ] |
| `<arrow>` | `src/__tests__/lib/catalogue-index.test.ts:29` | 79 | [ ] |
| `useAdminCataloguePanel` | `src/components/admin/useAdminCataloguePanel.ts:65` | 77 | [ ] |
| `ToastProvider` | `src/components/ui/ToastProvider.tsx:18` | 77 | [ ] |
| `<arrow>` | `src/__tests__/components/ui/ProductCard.test.tsx:20` | 76 | [ ] |
| `<arrow>` | `src/__tests__/lib/list-query.test.ts:11` | 76 | [ ] |
| `<arrow>` | `src/__tests__/components/layout/Footer.test.tsx:5` | 75 | [ ] |
| `sitemap` | `app/sitemap.ts:6` | 74 | [ ] |
| `<arrow>` | `src/components/order/OrderSummaryCard.tsx:81` | 74 | [ ] |
| `HeroParticles3D` | `src/components/pages/HeroParticles3D.tsx:191` | 73 | [ ] |
| `computeDashboardStats` | `src/lib/stats.ts:37` | 73 | [ ] |
| `Footer` | `src/components/layout/Footer.tsx:49` | 72 | [ ] |
| `<arrow>` | `src/__tests__/lib/redis-cache.test.ts:10` | 71 | [ ] |
| `createOrderColumns` | `src/components/admin/table/columns.orders.tsx:50` | 71 | [ ] |
| `GET` | `app/api/categories/route.ts:16` | 70 | [ ] |
| `useAdminOrdersPanel` | `src/components/admin/useAdminOrdersPanel.ts:55` | 70 | [ ] |
| `OrderCard` | `src/components/admin/AdminOrdersPanel.tsx:39` | 69 | [ ] |
| `AdminTrackingModal` | `src/components/admin/AdminTrackingModal.tsx:11` | 69 | [ ] |
| `<arrow>` | `src/__tests__/lib/hooks/useAdminHeaderActions.test.ts:25` | 68 | [ ] |
| `<arrow>` | `src/__tests__/lib/rate-limiter.test.ts:4` | 67 | [ ] |
| `apiFetch` | `src/lib/api/client.ts:83` | 67 | [ ] |
| `<arrow>` | `src/__tests__/components/admin/AdminOrdersPanel.test.tsx:49` | 66 | [ ] |
| `<arrow>` | `src/components/admin/AdminCategoriesPanel.tsx:247` | 65 | [ ] |
| `transitionOrderStatus` | `src/lib/order-intake.ts:444` | 65 | [ ] |
| `<arrow>` | `src/__tests__/api/categories.test.ts:94` | 64 | [ ] |
| `<arrow>` | `src/__tests__/api/orders.id.test.ts:21` | 64 | [ ] |
| `<arrow>` | `src/__tests__/lib/razorpay-server.test.ts:126` | 64 | [ ] |
| `<arrow>` | `src/components/admin/PrintShippingLabelModal.tsx:429` | 64 | [ ] |
| `GET` | `app/api/category/[slug]/products/route.ts:13` | 63 | [ ] |
| `CatalogueProductLightbox` | `src/components/admin/AdminCataloguePanel.tsx:278` | 63 | [ ] |
| `CategoryPage` | `app/category/[slug]/page.tsx:61` | 62 | [ ] |
| `<arrow>` | `src/__tests__/components/admin/AdminCategoriesPanel.test.tsx:53` | 62 | [ ] |
| `<arrow>` | `src/__tests__/lib/hooks/useAdminMutations.test.tsx:47` | 62 | [ ] |
| `<arrow>` | `src/__tests__/lib/razorpay-server.test.ts:37` | 62 | [ ] |
| `ShippingNudgePopup` | `src/components/ui/ShippingNudgePopup.tsx:17` | 62 | [ ] |
| `loadLatestCategories` | `src/lib/catalogue-cache.ts:66` | 61 | [ ] |

### 3.2 High-complexity functions (114)

Sorted by cyclomatic complexity (descending).

| Severity | Function | File:line | CC | Cog | LOC | CRAP | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 🔴 critical | `order` | `src/lib/order-intake.ts:149` | 36 | 64 | 194 | 315.9 | [ ] |
| 🔴 critical | `OrderDetailModal` | `src/components/order/OrderDetailModal.tsx:29` | 29 | 34 | 282 | 210.7 | [ ] |
| 🔴 critical | `CatalogueContent` | `src/components/pages/catalogue-content.tsx:30` | 26 | 51 | 360 | 172 | [ ] |
| 🔴 critical | `<arrow>` | `src/components/admin/AdminCataloguePanel.tsx:405` | 23 | 21 | 103 | 137.3 | [ ] |
| 🔴 critical | `main` | `scripts/run-lighthouse.mjs:343` | 22 | 27 | 161 | 506 | [ ] |
| 🔴 critical | `analyzeRun` | `scripts/analyze-lighthouse.mjs:121` | 21 | 39 | 79 | 462 | [ ] |
| 🔴 critical | `GET` | `app/api/products/route.ts:39` | 20 | 19 | 109 | 420 | [ ] |
| 🔴 critical | `DeliveryDetailsStep` | `app/order/page.tsx:57` | 20 | 27 | 53 | 420 | [ ] |
| 🟠 high | `ProductCard` | `src/components/ui/ProductCard.tsx:47` | 18 | 17 | 98 | 88 | [ ] |
| 🔴 critical | `AdminPage` | `app/admin/page.tsx:36` | 17 | 18 | 142 | 306 | [ ] |
| 🔴 critical | `seedProducts` | `prisma/seed.ts:27` | 17 | 24 | 60 | 306 | [ ] |
| 🔴 critical | `<arrow>` | `scripts/generate-seed-from-excel.ts:238` | 17 | 16 | 26 | 306 | [ ] |
| 🟠 high | `AdminCataloguePanel` | `src/components/admin/AdminCataloguePanel.tsx:47` | 17 | 33 | 230 | 79.4 | [ ] |
| 🟠 high | `apiFetch` | `src/lib/api/client.ts:83` | 17 | 19 | 67 | 79.4 | [ ] |
| 🟠 high | `handleProductSave` | `src/lib/hooks/useAdminCatalogueController.ts:128` | 17 | 15 | 46 | 79.4 | [ ] |
| 🔴 critical | `main` | `scripts/generate-seed-from-excel.ts:39` | 16 | 25 | 431 | 272 | [ ] |
| 🟠 high | `Navbar` | `src/components/layout/Navbar.tsx:10` | 16 | 28 | 182 | undefined | [ ] |
| 🔴 critical | `ProductDetailsPage` | `app/catalogue/[id]/page.tsx:66` | 15 | 12 | 112 | 240 | [ ] |
| 🔴 critical | `diagnostics` | `scripts/analyze-lighthouse.mjs:94` | 15 | 12 | 13 | 240 | [ ] |
| 🔴 critical | `buildProductColMap` | `scripts/generate-seed-from-excel.ts:89` | 15 | 14 | 19 | 240 | [ ] |
| 🟠 high | `<arrow>` | `src/components/admin/AdminCategoriesPanel.tsx:247` | 15 | 14 | 65 | 63.6 | [ ] |
| 🔴 critical | `<arrow>` | `src/components/order/OrderSummaryCard.tsx:81` | 15 | 17 | 74 | 240 | [ ] |
| 🔴 critical | `ProductDetailsContent` | `src/components/pages/ProductDetailsContent.tsx:35` | 15 | 21 | 173 | 240 | [ ] |
| 🔴 critical | `CategoryContent` | `src/components/pages/category-content.tsx:38` | 15 | 27 | 232 | 240 | [ ] |
| 🔴 critical | `parseArgs` | `scripts/run-lighthouse.mjs:44` | 14 | 5 | 34 | 210 | [ ] |
| 🟡 moderate | `GET` | `app/api/categories/route.ts:16` | 13 | 15 | 70 | 49.5 | [ ] |
| 🔴 critical | `seedOrders` | `prisma/seed.ts:102` | 13 | 23 | 93 | 182 | [ ] |
| 🔴 critical | `<arrow>` | `scripts/generate-seed-from-excel.ts:124` | 13 | 12 | 21 | 182 | [ ] |
| 🟠 high | `ProductFormModal` | `src/components/admin/ProductFormModal.tsx:39` | 13 | 28 | 448 | 49.5 | [ ] |
| 🟡 moderate | `<arrow>` | `src/components/admin/ProductFormModal.tsx:336` | 13 | 13 | 101 | 49.5 | [ ] |
| 🟡 moderate | `cell` | `src/components/admin/table/columns.categories.tsx:73` | 13 | 12 | 50 | 49.5 | [ ] |
| 🔴 critical | `buildCreateData` | `app/api/products/route.ts:165` | 12 | 11 | 16 | 156 | [ ] |
| 🔴 critical | `CataloguePage` | `app/catalogue/page.tsx:39` | 12 | 13 | 82 | 156 | [ ] |
| 🔴 critical | `PaymentStep` | `app/order/page.tsx:111` | 12 | 16 | 152 | 156 | [ ] |
| 🔴 critical | `<arrow>` | `scripts/generate-seed-from-excel.ts:294` | 12 | 11 | 24 | 156 | [ ] |
| 🟠 high | `PrintShippingLabelModal` | `src/components/admin/PrintShippingLabelModal.tsx:26` | 12 | 25 | 520 | 43.1 | [ ] |
| 🔴 critical | `ProductImageGallery` | `src/components/ui/ProductImageGallery.tsx:16` | 12 | 24 | 262 | 156 | [ ] |
| 🔴 critical | `PUT` | `app/api/products/[id]/route.ts:59` | 11 | 9 | 59 | 132 | [ ] |
| 🟡 moderate | `GET` | `app/api/track/route.ts:16` | 11 | 11 | 44 | 37.1 | [ ] |
| 🔴 critical | `PersonalDetailsStep` | `app/order/page.tsx:25` | 11 | 11 | 31 | 132 | [ ] |
| 🔴 critical | `OrderPage` | `app/order/page.tsx:264` | 11 | 17 | 283 | 132 | [ ] |
| 🟡 moderate | `CatalogueProductLightbox` | `src/components/admin/AdminCataloguePanel.tsx:278` | 11 | 11 | 63 | 37.1 | [ ] |
| 🟡 moderate | `OrderCard` | `src/components/admin/AdminOrdersPanel.tsx:39` | 11 | 7 | 69 | 37.1 | [ ] |
| 🟡 moderate | `ShippingLabel` | `src/components/admin/ShippingLabel.tsx:30` | 11 | 20 | 239 | 37.1 | [ ] |
| 🟡 moderate | `<arrow>` | `src/components/layout/NavCartDropdown.tsx:47` | 11 | 11 | 60 | 37.1 | [ ] |
| 🟡 moderate | `compareIndexProducts` | `src/lib/catalogue-cache.ts:173` | 11 | 17 | 17 | 37.1 | [ ] |
| 🔴 critical | `EndpointCard` | `app/docs/page.tsx:101` | 10 | 6 | 28 | 110 | [ ] |
| 🔴 critical | `TrackPage` | `app/track/page.tsx:11` | 10 | 18 | 157 | 110 | [ ] |
| 🔴 critical | `failedCategoryAudits` | `scripts/analyze-lighthouse.mjs:108` | 10 | 14 | 12 | 110 | [ ] |
| 🔴 critical | `collectResults` | `scripts/run-lighthouse.mjs:214` | 10 | 11 | 39 | 110 | [ ] |
| 🟡 moderate | `CategoryFormModal` | `src/components/admin/CategoryFormModal.tsx:17` | 10 | 15 | 104 | 31.6 | [ ] |
| 🟡 moderate | `resetToOrderData` | `src/components/admin/PrintShippingLabelModal.tsx:76` | 10 | 10 | 32 | 31.6 | [ ] |
| 🟡 moderate | `useAdminCataloguePanel` | `src/components/admin/useAdminCataloguePanel.ts:65` | 10 | 16 | 77 | 31.6 | [ ] |
| 🔴 critical | `CheckoutActions` | `src/components/order/CheckoutActions.tsx:16` | 10 | 23 | 13 | 110 | [ ] |
| 🔴 critical | `CategoryCard` | `src/components/pages/LatestInEveryCategory.tsx:18` | 10 | 8 | 95 | 110 | [ ] |
| 🔴 critical | `handleAddToCart` | `src/components/pages/ProductDetailsContent.tsx:68` | 10 | 13 | 37 | 110 | [ ] |
| 🟡 moderate | `<arrow>` | `src/lib/admin-route.ts:152` | 10 | 9 | 30 | 31.6 | [ ] |
| 🟡 moderate | `fetchCatalogueProducts` | `src/lib/api/index.ts:111` | 10 | 7 | 18 | 31.6 | [ ] |
| 🟡 moderate | `validateCsrfOrigin` | `src/lib/csrf.ts:6` | 10 | 10 | 15 | 31.6 | [ ] |
| 🟡 moderate | `productToFormState` | `src/lib/hooks/useAdminCatalogueController.ts:61` | 10 | 9 | 22 | 31.6 | [ ] |
| 🔴 critical | `runValidation` | `src/lib/hooks/useCheckoutForm.ts:36` | 10 | 18 | 15 | 110 | [ ] |
| 🟡 moderate | `transitionOrderStatus` | `src/lib/order-intake.ts:444` | 10 | 10 | 65 | 31.6 | [ ] |
| 🟡 moderate | `generateInvoice` | `src/lib/pdf-documents.ts:29` | 10 | 15 | 238 | 31.6 | [ ] |
| 🟠 high | `handleSearch` | `app/track/page.tsx:21` | 9 | 11 | 32 | 90 | [ ] |
| 🟠 high | `topOpportunities` | `scripts/analyze-lighthouse.mjs:56` | 9 | 10 | 18 | 90 | [ ] |
| 🟠 high | `extractUrl` | `scripts/generate-seed-from-excel.ts:28` | 9 | 7 | 10 | 90 | [ ] |
| 🟠 high | `OrderSummaryCard` | `src/components/order/OrderSummaryCard.tsx:31` | 9 | 14 | 185 | 90 | [ ] |
| 🟠 high | `GiftBoxSelector` | `src/components/pages/GiftBoxSelector.tsx:29` | 9 | 11 | 168 | 90 | [ ] |
| 🟠 high | `<arrow>` | `src/components/pages/GiftBoxSelector.tsx:118` | 9 | 6 | 53 | 90 | [ ] |
| 🟠 high | `<arrow>` | `src/components/pages/HeroParticles3D.tsx:79` | 9 | 13 | 44 | 90 | [ ] |
| 🟠 high | `POST` | `app/api/products/route.ts:184` | 8 | 7 | 40 | 72 | [ ] |
| 🟠 high | `generateMetadata` | `app/catalogue/[id]/page.tsx:35` | 8 | 7 | 30 | 72 | [ ] |
| 🟠 high | `lcpElement` | `scripts/analyze-lighthouse.mjs:75` | 8 | 3 | 10 | 72 | [ ] |
| 🟠 high | `findChrome` | `scripts/run-lighthouse.mjs:125` | 8 | 11 | 19 | 72 | [ ] |
| 🟡 moderate | `GiftBoxModal` | `src/components/pages/GiftBoxModal.tsx:39` | 8 | 23 | 238 | undefined | [ ] |
| 🟠 high | `handleKeyDown` | `src/components/ui/ProductImageGallery.tsx:61` | 8 | 9 | 19 | 72 | [ ] |
| 🟠 high | `POST` | `app/api/create-order/route.ts:21` | 7 | 7 | 38 | 56 | [ ] |
| 🟠 high | `GET` | `app/api/cron/db-health/route.ts:20` | 7 | 7 | 31 | 56 | [ ] |
| 🟠 high | `POST` | `app/api/verify-payment/route.ts:17` | 7 | 7 | 60 | 56 | [ ] |
| 🟠 high | `LatestInEveryCategory` | `src/components/pages/LatestInEveryCategory.tsx:114` | 7 | 17 | 124 | 56 | [ ] |
| 🟠 high | `retry` | `src/components/providers/QueryProvider.tsx:18` | 7 | 4 | 6 | 56 | [ ] |
| 🟡 moderate | `schemaLabel` | `app/docs/page.tsx:62` | 6 | 5 | 6 | 42 | [ ] |
| 🟡 moderate | `handleRazorpayPayment` | `app/order/page.tsx:366` | 6 | 5 | 89 | 42 | [ ] |
| 🟡 moderate | `proxy` | `proxy.ts:11` | 6 | 6 | 32 | 42 | [ ] |
| 🟡 moderate | `parseArgs` | `scripts/analyze-lighthouse.mjs:24` | 6 | 4 | 12 | 42 | [ ] |
| 🟡 moderate | `<arrow>` | `scripts/generate-seed-from-excel.ts:194` | 6 | 5 | 11 | 42 | [ ] |
| 🟡 moderate | `<arrow>` | `scripts/generate-seed-from-excel.ts:347` | 6 | 5 | 10 | 42 | [ ] |
| 🟡 moderate | `printSummary` | `scripts/run-lighthouse.mjs:263` | 6 | 6 | 46 | 42 | [ ] |
| 🟡 moderate | `useAdminCategoriesController` | `src/lib/hooks/useAdminCategoriesController.ts:48` | 6 | 22 | 145 | undefined | [ ] |
| 🟡 moderate | `handleSubmit` | `app/admin/login/page.tsx:19` | 5 | 5 | 21 | 30 | [ ] |
| 🟡 moderate | `batchedFetch` | `app/api/export/route.ts:8` | 5 | 7 | 17 | 30 | [ ] |
| 🟡 moderate | `buildUpdateData` | `app/api/products/[id]/route.ts:47` | 5 | 7 | 9 | 30 | [ ] |
| 🟡 moderate | `renderSchema` | `app/docs/page.tsx:69` | 5 | 5 | 31 | 30 | [ ] |
| 🟡 moderate | `<arrow>` | `app/docs/page.tsx:83` | 5 | 4 | 14 | 30 | [ ] |
| 🟡 moderate | `handleSubmit` | `app/order/page.tsx:456` | 5 | 4 | 32 | 30 | [ ] |
| 🟡 moderate | `sitemap` | `app/sitemap.ts:6` | 5 | 4 | 74 | 30 | [ ] |
| 🟡 moderate | `fmtScore` | `scripts/analyze-lighthouse.mjs:201` | 5 | 5 | 5 | 30 | [ ] |
| 🟡 moderate | `parseDate` | `scripts/generate-seed-from-excel.ts:19` | 5 | 4 | 8 | 30 | [ ] |
| 🟡 moderate | `<arrow>` | `scripts/generate-seed-from-excel.ts:73` | 5 | 4 | 12 | 30 | [ ] |
| 🟡 moderate | `<arrow>` | `scripts/generate-seed-from-excel.ts:156` | 5 | 4 | 7 | 30 | [ ] |
| 🟡 moderate | `<arrow>` | `scripts/generate-seed-from-excel.ts:368` | 5 | 4 | 9 | 30 | [ ] |
| 🟡 moderate | `collectHtml` | `scripts/open-lighthouse-report.mjs:17` | 5 | 5 | 9 | 30 | [ ] |
| 🟡 moderate | `fmtScore` | `scripts/run-lighthouse.mjs:88` | 5 | 5 | 6 | 30 | [ ] |
| 🟡 moderate | `waitForServer` | `scripts/run-lighthouse.mjs:110` | 5 | 6 | 14 | 30 | [ ] |
| 🟡 moderate | `resolveFirstProduct` | `scripts/run-lighthouse.mjs:162` | 5 | 4 | 12 | 30 | [ ] |
| 🟡 moderate | `<arrow>` | `scripts/run-lighthouse.mjs:179` | 5 | 3 | 9 | 30 | [ ] |
| 🟡 moderate | `AdminCategoriesPanel` | `src/components/admin/AdminCategoriesPanel.tsx:39` | 5 | 22 | 164 | undefined | [ ] |
| 🟡 moderate | `useAdminOrdersPanel` | `src/components/admin/useAdminOrdersPanel.ts:55` | 5 | 13 | 70 | 30 | [ ] |
| 🟡 moderate | `scroll` | `src/components/pages/LatestInEveryCategory.tsx:152` | 5 | 3 | 10 | 30 | [ ] |
| 🟡 moderate | `TrackOrderCard` | `src/components/track/TrackOrderCard.tsx:12` | 5 | 3 | 50 | 30 | [ ] |
| 🟡 moderate | `<arrow>` | `src/components/ui/Breadcrumbs.tsx:16` | 5 | 5 | 19 | 30 | [ ] |
| 🟡 moderate | `imageLoader` | `src/lib/image-loader.ts:28` | 5 | 5 | 21 | 30 | [ ] |
| 🟡 moderate | `AdminOrdersPanel` | `src/components/admin/AdminOrdersPanel.tsx:109` | 4 | 17 | 146 | undefined | [ ] |
| 🟡 moderate | `useAdminCatalogueController` | `src/lib/hooks/useAdminCatalogueController.ts:84` | 4 | 18 | 126 | undefined | [ ] |

---

## 4. File Health Scores (200 files)

Sorted by triage concern (higher = address first). **Risk** is the max CRAP score (untested complexity); **MI** is the maintainability index (100 = best). **Risk flag** marks files where CRAP risk is the dominant concern.

| Rank | File | LOC | Fan-in | Fan-out | Dead % | Density | MI | Max CRAP | Funcs > thresh | Triage |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `scripts/run-lighthouse.mjs` | 517 | 0 | 0 | 0% | 0.26 | 92.2 | 506 | 9 | ⚠️ risk |
| 2 | `scripts/analyze-lighthouse.mjs` | 214 | 0 | 0 | 0% | 0.52 | 84.4 | 462 | 7 | ⚠️ risk |
| 3 | `app/order/page.tsx` | 547 | 0 | 16 | 0% | 0.22 | 82.1 | 420 | 6 | ⚠️ risk |
| 4 | `app/api/products/route.ts` | 233 | 0 | 7 | 0% | 0.19 | 86 | 420 | 3 | ⚠️ risk |
| 5 | `src/lib/order-intake.ts` | 509 | 4 | 6 | 0% | 0.14 | 88 | 315.9 | 2 | ⚠️ risk |
| 6 | `app/admin/page.tsx` | 178 | 0 | 16 | 0% | 0.13 | 84.8 | 306 | 1 | ⚠️ risk |
| 7 | `scripts/generate-seed-from-excel.ts` | 472 | 0 | 0 | 0% | 0.33 | 90.1 | 306 | 12 | ⚠️ risk |
| 8 | `prisma/seed.ts` | 215 | 0 | 1 | 0% | 0.17 | 92.1 | 306 | 2 | ⚠️ risk |
| 9 | `src/components/pages/ProductDetailsContent.tsx` | 208 | 1 | 10 | 0% | 0.16 | 85.6 | 240 | 2 | ⚠️ risk |
| 10 | `src/components/pages/category-content.tsx` | 270 | 1 | 10 | 0% | 0.13 | 86.5 | 240 | 1 | ⚠️ risk |
| 11 | `app/catalogue/[id]/page.tsx` | 178 | 0 | 5 | 0% | 0.16 | 88 | 240 | 2 | ⚠️ risk |
| 12 | `src/components/order/OrderSummaryCard.tsx` | 216 | 1 | 3 | 0% | 0.15 | 90 | 240 | 2 | ⚠️ risk |
| 13 | `src/components/order/OrderDetailModal.tsx` | 311 | 3 | 7 | 0% | 0.2 | 85.7 | 210.7 | 1 | ⚠️ risk |
| 14 | `src/components/pages/catalogue-content.tsx` | 390 | 2 | 10 | 0% | 0.2 | 84.4 | 172 | 1 | ⚠️ risk |
| 15 | `app/catalogue/page.tsx` | 121 | 0 | 6 | 0% | 0.12 | 88.6 | 156 | 1 | ⚠️ risk |
| 16 | `src/components/ui/ProductImageGallery.tsx` | 278 | 1 | 3 | 0% | 0.18 | 89.1 | 156 | 2 | ⚠️ risk |
| 17 | `src/components/admin/AdminCataloguePanel.tsx` | 511 | 2 | 8 | 0% | 0.18 | 85.8 | 137.3 | 3 | ⚠️ risk |
| 18 | `app/api/products/[id]/route.ts` | 150 | 0 | 6 | 0% | 0.25 | 84.7 | 132 | 2 | ⚠️ risk |
| 19 | `app/track/page.tsx` | 168 | 0 | 6 | 0% | 0.15 | 87.7 | 110 | 2 | ⚠️ risk |
| 20 | `src/components/pages/LatestInEveryCategory.tsx` | 238 | 1 | 5 | 0% | 0.16 | 88 | 110 | 3 | ⚠️ risk |
| 21 | `src/lib/hooks/useCheckoutForm.ts` | 94 | 1 | 1 | 0% | 0.22 | 90.6 | 110 | 1 | ⚠️ risk |
| 22 | `app/docs/page.tsx` | 219 | 0 | 1 | 0% | 0.21 | 90.9 | 110 | 4 | ⚠️ risk |
| 23 | `src/components/order/CheckoutActions.tsx` | 29 | 1 | 1 | 0% | 0.34 | 91.3 | 110 | 1 | ⚠️ risk |
| 24 | `src/components/pages/GiftBoxSelector.tsx` | 197 | 1 | 2 | 0% | 0.23 | 88.7 | 90 | 2 | ⚠️ risk |
| 25 | `src/components/pages/HeroParticles3D.tsx` | 264 | 1 | 0 | 0% | 0.13 | 96.1 | 90 | 1 | ⚠️ risk |
| 26 | `src/components/ui/ProductCard.tsx` | 147 | 5 | 5 | 0% | 0.16 | 88 | 88 | 1 | ⚠️ risk |
| 27 | `src/lib/hooks/useAdminCatalogueController.ts` | 210 | 2 | 4 | 0% | 0.21 | 87.3 | 79.4 | 2 | ⚠️ risk |
| 28 | `src/lib/api/client.ts` | 150 | 5 | 1 | 0% | 0.23 | 90.3 | 79.4 | 1 | ⚠️ risk |
| 29 | `src/components/admin/AdminCategoriesPanel.tsx` | 315 | 2 | 6 | 0% | 0.12 | 88.6 | 63.6 | 1 | ⚠️ risk |
| 30 | `app/api/create-order/route.ts` | 58 | 0 | 4 | 0% | 0.12 | 90 | 56 | 1 | ⚠️ risk |
| 31 | `src/components/providers/QueryProvider.tsx` | 52 | 1 | 0 | 0% | 0.31 | 90.7 | 56 | 1 | ⚠️ risk |
| 32 | `app/api/cron/db-health/route.ts` | 51 | 0 | 2 | 0% | 0.14 | 91.4 | 56 | 1 | ⚠️ risk |
| 33 | `app/api/verify-payment/route.ts` | 76 | 0 | 3 | 0% | 0.09 | 91.8 | 56 | 1 | ⚠️ risk |
| 34 | `app/api/categories/route.ts` | 134 | 1 | 8 | 0% | 0.21 | 84.9 | 49.5 | 1 | ⚠️ risk |
| 35 | `src/components/admin/ProductFormModal.tsx` | 496 | 1 | 4 | 0% | 0.22 | 87 | 49.5 | 2 | ⚠️ risk |
| 36 | `src/components/admin/table/columns.categories.tsx` | 125 | 1 | 1 | 0% | 0.26 | 89.4 | 49.5 | 1 | ⚠️ risk |
| 37 | `src/components/admin/PrintShippingLabelModal.tsx` | 546 | 1 | 2 | 0% | 0.15 | 91.1 | 43.1 | 2 | ⚠️ risk |
| 38 | `proxy.ts` | 52 | 0 | 1 | 0% | 0.23 | 90.3 | 42 | 1 | ⚠️ risk |
| 39 | `src/lib/catalogue-cache.ts` | 254 | 13 | 4 | 20% | 0.2 | 83.6 | 37.1 | 1 | ⚠️ risk |
| 40 | `src/components/admin/AdminOrdersPanel.tsx` | 255 | 2 | 7 | 0% | 0.18 | 86.3 | 37.1 | 1 | ⚠️ risk |
| 41 | `app/api/track/route.ts` | 59 | 1 | 3 | 0% | 0.19 | 88.8 | 37.1 | 1 | ⚠️ risk |
| 42 | `src/components/layout/NavCartDropdown.tsx` | 136 | 1 | 3 | 0% | 0.18 | 89.1 | 37.1 | 1 | ⚠️ risk |
| 43 | `src/components/admin/ShippingLabel.tsx` | 268 | 2 | 1 | 0% | 0.09 | 94.5 | 37.1 | 1 | ⚠️ risk |
| 44 | `src/components/admin/useAdminCataloguePanel.ts` | 142 | 2 | 4 | 0% | 0.13 | 89.7 | 31.6 | 1 | ⚠️ risk |
| 45 | `src/components/admin/CategoryFormModal.tsx` | 121 | 1 | 3 | 0% | 0.15 | 90 | 31.6 | 1 | ⚠️ risk |
| 46 | `src/lib/api/index.ts` | 309 | 7 | 2 | 0% | 0.17 | 90.5 | 31.6 | 1 | ⚠️ risk |
| 47 | `src/lib/admin-route.ts` | 183 | 10 | 2 | 0% | 0.16 | 90.8 | 31.6 | 1 | ⚠️ risk |
| 48 | `src/lib/csrf.ts` | 21 | 9 | 1 | 0% | 0.48 | 91.2 | 31.6 | 1 | ⚠️ risk |
| 49 | `src/lib/pdf-documents.ts` | 266 | 2 | 1 | 0% | 0.05 | 95.7 | 31.6 | 1 | ⚠️ risk |
| 50 | `src/components/admin/useAdminOrdersPanel.ts` | 125 | 1 | 4 | 0% | 0.14 | 89.4 | 30 | 1 | ⚠️ risk |
| 51 | `app/api/export/route.ts` | 72 | 0 | 3 | 0% | 0.15 | 90 | 30 | 1 | ⚠️ risk |
| 52 | `src/components/track/TrackOrderCard.tsx` | 62 | 1 | 3 | 0% | 0.1 | 91.5 | 30 | 1 | ⚠️ risk |
| 53 | `scripts/open-lighthouse-report.mjs` | 51 | 0 | 0 | 0% | 0.24 | 92.8 | 30 | 1 | ⚠️ risk |
| 54 | `app/admin/login/page.tsx` | 111 | 0 | 1 | 0% | 0.12 | 93.6 | 30 | 1 | ⚠️ risk |
| 55 | `app/sitemap.ts` | 80 | 0 | 1 | 0% | 0.09 | 94.5 | 30 | 1 | ⚠️ risk |
| 56 | `src/components/ui/Breadcrumbs.tsx` | 39 | 3 | 0 | 0% | 0.15 | 96.5 | 30 | 1 | ⚠️ risk |
| 57 | `src/lib/image-loader.ts` | 49 | 0 | 0 | 0% | 0.1 | 97.1 | 30 | 1 | ⚠️ risk |
| 58 | `app/api/categories/[id]/route.ts` | 106 | 1 | 7 | 0% | 0.16 | 86.9 | 26.5 | 0 | structure |
| 59 | `app/api/orders/route.ts` | 109 | 1 | 8 | 0% | 0.11 | 87.9 | 26.5 | 0 | structure |
| 60 | `src/lib/list-query.ts` | 54 | 4 | 0 | 0% | 0.19 | 94.3 | 26.5 | 0 | structure |
| 61 | `src/components/admin/table/AdminDataTable.tsx` | 117 | 4 | 0 | 0% | 0.15 | 95.5 | 26.5 | 0 | structure |
| 62 | `app/api/auth/login/route.ts` | 68 | 1 | 6 | 0% | 0.12 | 88.6 | 21.8 | 0 | structure |
| 63 | `src/components/pages/GiftBoxModal.tsx` | 277 | 3 | 2 | 0% | 0.19 | 89.9 | 21.8 | 0 | structure |
| 64 | `app/layout.tsx` | 197 | 0 | 10 | 0% | 0.04 | 89.2 | 20 | 0 | structure |
| 65 | `src/components/order/ConfirmationDetails.tsx` | 118 | 1 | 4 | 0% | 0.13 | 89.7 | 20 | 0 | structure |
| 66 | `app/category/[slug]/page.tsx` | 123 | 0 | 5 | 0% | 0.09 | 90.1 | 20 | 0 | structure |
| 67 | `src/lib/razorpay.ts` | 35 | 1 | 1 | 0% | 0.26 | 91.8 | 20 | 0 | structure |
| 68 | `src/components/admin/AdminDeleteConfirm.tsx` | 59 | 1 | 1 | 0% | 0.12 | 93.6 | 20 | 0 | structure |
| 69 | `app/confirmation/[id]/page.tsx` | 124 | 0 | 2 | 0% | 0.05 | 94.1 | 20 | 0 | structure |
| 70 | `src/lib/hooks/useAdminCategoriesController.ts` | 193 | 4 | 4 | 0% | 0.15 | 89.1 | 17.6 | 0 | structure |
| 71 | `src/components/cart/CartProvider.tsx` | 308 | 10 | 1 | 0% | 0.25 | 89.7 | 17.6 | 0 | structure |
| 72 | `app/api/category/[slug]/products/route.ts` | 76 | 1 | 4 | 0% | 0.09 | 90.9 | 17.6 | 0 | structure |
| 73 | `src/lib/prisma.ts` | 183 | 40 | 1 | 0% | 0.19 | 91.5 | 17.6 | 0 | structure |
| 74 | `src/lib/razorpay-server.ts` | 157 | 5 | 0 | 20% | 0.15 | 91.5 | 17.6 | 0 | structure |
| 75 | `src/lib/hooks/useAddToCart.ts` | 116 | 2 | 2 | 0% | 0.13 | 91.7 | 17.6 | 0 | structure |
| 76 | `src/lib/product-read.ts` | 210 | 4 | 2 | 0% | 0.11 | 92.3 | 17.6 | 0 | structure |
| 77 | `src/components/layout/Navbar.tsx` | 192 | 2 | 3 | 0% | 0.26 | 86.7 | 16 | 0 | structure |
| 78 | `src/lib/hooks/useAdminMutations.ts` | 196 | 9 | 3 | 0% | 0.26 | 86.7 | 13.8 | 0 | structure |
| 79 | `src/components/admin/table/columns.catalogue.tsx` | 265 | 2 | 3 | 0% | 0.22 | 87.9 | 13.8 | 0 | structure |
| 80 | `src/lib/hooks/useAdminOrdersController.ts` | 131 | 2 | 5 | 0% | 0.15 | 88.3 | 13.8 | 0 | structure |
| 81 | `src/__tests__/lib/order-fulfilment.test.ts` | 194 | 0 | 4 | 0% | 0.14 | 89.4 | 13.8 | 0 | structure |
| 82 | `app/api/health/redis/route.ts` | 35 | 2 | 1 | 0% | 0.26 | 91.8 | 13.8 | 0 | structure |
| 83 | `src/lib/hooks/useAdminSession.ts` | 28 | 2 | 1 | 0% | 0.32 | 91.9 | 13.8 | 0 | structure |
| 84 | `src/components/layout/Footer.tsx` | 121 | 2 | 1 | 0% | 0.06 | 95.4 | 13.8 | 0 | structure |
| 85 | `src/components/order/CheckoutProgress.tsx` | 58 | 2 | 0 | 0% | 0.14 | 95.8 | 13.8 | 0 | structure |
| 86 | `src/lib/excel-export.ts` | 218 | 3 | 0 | 0% | 0.14 | 95.8 | 13.8 | 0 | structure |
| 87 | `app/api/orders/[id]/tracking/route.ts` | 38 | 0 | 5 | 0% | 0.08 | 91 | 12 | 0 | structure |
| 88 | `src/components/admin/AdminChartsSection.tsx` | 185 | 1 | 1 | 0% | 0.13 | 93.3 | 12 | 0 | structure |
| 89 | `src/components/admin/AdminTrackingModal.tsx` | 80 | 1 | 1 | 0% | 0.13 | 93.3 | 12 | 0 | structure |
| 90 | `app/api/gift-boxes/route.ts` | 30 | 0 | 2 | 0% | 0.1 | 93.8 | 12 | 0 | structure |
| 91 | `scripts/check-static-dynamic.mjs` | 65 | 0 | 0 | 0% | 0.18 | 94.6 | 12 | 0 | structure |
| 92 | `instrumentation.ts` | 16 | 0 | 1 | 0% | 0.19 | 95.4 | 12 | 0 | structure |
| 93 | `lib/axiom/client.ts` | 30 | 1 | 1 | 0% | 0.1 | 95.4 | 12 | 0 | structure |
| 94 | `scripts/generate-fallow-report.mjs` | 285 | 0 | 0 | 0% | 0.15 | 95.5 | 12 | 0 | structure |
| 95 | `src/components/admin/AdminHeader.tsx` | 53 | 1 | 0 | 0% | 0.06 | 98.2 | 12 | 0 | structure |
| 96 | `src/lib/redis-cache.ts` | 52 | 11 | 2 | 0% | 0.31 | 86.3 | 10.4 | 0 | structure |
| 97 | `src/lib/cart-cookie.ts` | 87 | 2 | 3 | 0% | 0.22 | 87.9 | 10.4 | 0 | structure |
| 98 | `src/components/admin/table/columns.orders.tsx` | 121 | 2 | 4 | 0% | 0.15 | 89.1 | 10.4 | 0 | structure |
| 99 | `src/lib/rate-limiter.ts` | 70 | 7 | 1 | 0% | 0.23 | 90.3 | 10.4 | 0 | structure |
| 100 | `src/lib/stats.ts` | 109 | 1 | 1 | 0% | 0.09 | 94.5 | 10.4 | 0 | structure |
| 101 | `src/components/ui/SkeletonLoader.tsx` | 57 | 2 | 0 | 0% | 0.18 | 94.6 | 10.4 | 0 | structure |
| 102 | `src/lib/csrf-helpers.ts` | 15 | 1 | 0 | 0% | 0.6 | 94.6 | 10.4 | 0 | structure |
| 103 | `src/components/ui/FallbackImage.tsx` | 55 | 14 | 0 | 0% | 0.16 | 95.2 | 10.4 | 0 | structure |
| 104 | `src/lib/utils.ts` | 25 | 9 | 0 | 0% | 0.28 | 95.8 | 10.4 | 0 | structure |
| 105 | `src/lib/pricing.ts` | 131 | 9 | 0 | 0% | 0.1 | 97 | 10.4 | 0 | structure |
| 106 | `src/__tests__/lib/checkout-fields.test.ts` | 122 | 0 | 2 | 0% | 0.34 | 85.4 | 7.5 | 0 | structure |
| 107 | `src/lib/hooks/useAdminData.ts` | 108 | 8 | 3 | 0% | 0.2 | 88.5 | 7.5 | 0 | structure |
| 108 | `src/__tests__/components/layout/Navbar.test.tsx` | 391 | 0 | 2 | 0% | 0.2 | 89.6 | 7.5 | 0 | structure |
| 109 | `src/lib/order-read.ts` | 60 | 1 | 1 | 0% | 0.25 | 89.7 | 7.5 | 0 | structure |
| 110 | `src/__tests__/lib/auth.test.ts` | 108 | 0 | 1 | 0% | 0.19 | 91.5 | 7.5 | 0 | structure |
| 111 | `src/components/ui/ComplementaryGiftPopup.tsx` | 128 | 2 | 1 | 0% | 0.17 | 92.1 | 7.5 | 0 | structure |
| 112 | `app/api/orders/[id]/route.ts` | 44 | 1 | 2 | 0% | 0.09 | 93.2 | 7.5 | 0 | structure |
| 113 | `src/__tests__/mocks/redis.ts` | 110 | 5 | 0 | 0% | 0.21 | 93.7 | 7.5 | 0 | structure |
| 114 | `src/components/ui/StatusBadge.tsx` | 21 | 5 | 1 | 0% | 0.19 | 94.8 | 7.5 | 0 | structure |
| 115 | `lib/axiom/server.ts` | 28 | 7 | 1 | 0% | 0.14 | 94.9 | 7.5 | 0 | structure |
| 116 | `src/lib/useFocusTrap.ts` | 48 | 10 | 0 | 0% | 0.25 | 92.8 | 7.3 | 0 | structure |
| 117 | `src/components/admin/AdminStatsGrid.tsx` | 49 | 1 | 3 | 0% | 0.08 | 92.1 | 6 | 0 | structure |
| 118 | `src/components/pages/home-content.tsx` | 159 | 1 | 3 | 0% | 0.04 | 93.3 | 6 | 0 | structure |
| 119 | `src/components/admin/useAdminCategoriesPanel.ts` | 77 | 1 | 3 | 0% | 0.03 | 93.6 | 6 | 0 | structure |
| 120 | `app/page.tsx` | 37 | 0 | 2 | 0% | 0.05 | 94.5 | 6 | 0 | structure |
| 121 | `scripts/export-to-excel.ts` | 67 | 0 | 1 | 0% | 0.06 | 95.4 | 6 | 0 | structure |
| 122 | `app/api/health/db/route.ts` | 15 | 0 | 1 | 0% | 0.13 | 96.1 | 6 | 0 | structure |
| 123 | `src/components/admin/AdminTabs.tsx` | 46 | 2 | 0 | 0% | 0.09 | 97.5 | 6 | 0 | structure |
| 124 | `app/error.tsx` | 41 | 0 | 0 | 0% | 0.07 | 98.3 | 6 | 0 | structure |
| 125 | `app/admin/error.tsx` | 55 | 0 | 0 | 0% | 0.05 | 98.5 | 6 | 0 | structure |
| 126 | `src/lib/query-keys.ts` | 42 | 4 | 0 | 0% | 0.55 | 86.1 | 4.9 | 0 | structure |
| 127 | `src/__tests__/lib/catalogue-cache.test.ts` | 60 | 0 | 3 | 0% | 0.17 | 89.4 | 4.9 | 0 | structure |
| 128 | `src/lib/auth.ts` | 74 | 14 | 1 | 0% | 0.22 | 90.6 | 4.9 | 0 | structure |
| 129 | `src/__tests__/lib/hooks/useAdminMutations.test.tsx` | 209 | 0 | 3 | 0% | 0.11 | 91.2 | 4.9 | 0 | structure |
| 130 | `src/lib/domain-filter.ts` | 64 | 7 | 0 | 0% | 0.28 | 91.6 | 4.9 | 0 | structure |
| 131 | `src/lib/env.ts` | 23 | 4 | 0 | 0% | 0.61 | 91.6 | 4.9 | 0 | structure |
| 132 | `app/api/stats/route.ts` | 25 | 1 | 3 | 0% | 0.12 | 92.7 | 4.9 | 0 | structure |
| 133 | `src/__tests__/components/admin/catalogue-sort-adapter.test.ts` | 30 | 0 | 1 | 0% | 0.23 | 93.1 | 4.9 | 0 | structure |
| 134 | `src/__tests__/components/admin/table/AdminDataTable.test.tsx` | 125 | 0 | 1 | 0% | 0.1 | 94.2 | 4.9 | 0 | structure |
| 135 | `src/lib/format.ts` | 63 | 20 | 0 | 0% | 0.16 | 95.2 | 4.9 | 0 | structure |
| 136 | `src/lib/checkout-fields.ts` | 102 | 4 | 1 | 0% | 0.05 | 95.7 | 4.9 | 0 | structure |
| 137 | `src/lib/constants.ts` | 182 | 13 | 1 | 0% | 0.02 | 96.6 | 4.9 | 0 | structure |
| 138 | `src/__tests__/utils/api-test.ts` | 24 | 10 | 0 | 0% | 0.13 | 98.1 | 4.9 | 0 | structure |
| 139 | `src/components/ui/ToastProvider.tsx` | 101 | 15 | 0 | 0% | 0.22 | 93.4 | 4.7 | 0 | structure |
| 140 | `src/components/ui/StockBadge.tsx` | 16 | 3 | 0 | 0% | 0.25 | 97.6 | 4 | 0 | structure |
| 141 | `src/__tests__/lib/catalogue-index.test.ts` | 107 | 0 | 5 | 0% | 0.16 | 88 | 2.9 | 0 | structure |
| 142 | `src/__tests__/lib/hooks/useShippingNudge.test.ts` | 115 | 0 | 2 | 0% | 0.25 | 88.1 | 1.2 | 0 | structure |
| 143 | `src/__tests__/setup.ts` | 103 | 0 | 3 | 0% | 0.21 | 88.2 | 2 | 0 | structure |
| 144 | `src/__tests__/api/categories.id.test.ts` | 131 | 0 | 7 | 0% | 0.11 | 88.4 | 1.2 | 0 | structure |
| 145 | `src/__tests__/api/categories.test.ts` | 158 | 0 | 7 | 0% | 0.11 | 88.4 | 1.2 | 0 | structure |
| 146 | `src/__tests__/lib/admin-route.test.ts` | 226 | 0 | 4 | 0% | 0.16 | 88.8 | 1.2 | 0 | structure |
| 147 | `src/__tests__/api/stats.test.ts` | 76 | 0 | 6 | 0% | 0.11 | 88.9 | 1.2 | 0 | structure |
| 148 | `src/__tests__/lib/hooks/useAdminHeaderActions.test.ts` | 93 | 0 | 3 | 0% | 0.18 | 89.1 | 1.2 | 0 | structure |
| 149 | `src/__tests__/api/track.test.ts` | 105 | 0 | 6 | 0% | 0.1 | 89.2 | 1.2 | 0 | structure |
| 150 | `src/__tests__/api/orders.test.ts` | 798 | 0 | 8 | 0% | 0.06 | 89.4 | 2.9 | 0 | structure |
| 151 | `src/__tests__/components/pages/catalogue-pagination.test.tsx` | 193 | 0 | 4 | 0% | 0.14 | 89.4 | 2.9 | 0 | structure |
| 152 | `src/__tests__/lib/format.test.ts` | 72 | 0 | 1 | 0% | 0.26 | 89.4 | 1.2 | 0 | structure |
| 153 | `src/__tests__/api/orders.id.test.ts` | 85 | 0 | 5 | 0% | 0.11 | 89.5 | 1.2 | 0 | structure |
| 154 | `src/__tests__/api/orders.status.test.ts` | 170 | 0 | 6 | 0% | 0.09 | 89.5 | 1.2 | 0 | structure |
| 155 | `src/__tests__/lib/hooks/useAdminCatalogueController.test.ts` | 128 | 0 | 3 | 0% | 0.16 | 89.7 | 1.2 | 0 | structure |
| 156 | `src/__tests__/lib/hooks/useAdminOrdersController.test.ts` | 138 | 0 | 3 | 0% | 0.16 | 89.7 | 1.2 | 0 | structure |
| 157 | `src/__tests__/lib/redis-cache.test.ts` | 95 | 0 | 3 | 0% | 0.16 | 89.7 | 1.2 | 0 | structure |
| 158 | `src/__tests__/lib/utils.test.ts` | 60 | 0 | 1 | 0% | 0.25 | 89.7 | 1.2 | 0 | structure |
| 159 | `src/__tests__/lib/order-intake.test.ts` | 197 | 0 | 3 | 0% | 0.15 | 90 | 2.9 | 0 | structure |
| 160 | `src/__tests__/api/auth.me.test.ts` | 65 | 0 | 4 | 0% | 0.11 | 90.3 | 1.2 | 0 | structure |
| 161 | `src/__tests__/components/admin/AdminCategoriesPanel.test.tsx` | 119 | 0 | 3 | 0% | 0.13 | 90.6 | 2.9 | 0 | structure |
| 162 | `src/__tests__/components/ui/StatusBadge.test.tsx` | 48 | 0 | 1 | 0% | 0.23 | 90.6 | 2.9 | 0 | structure |
| 163 | `src/__tests__/api/categories.latest.test.ts` | 81 | 0 | 4 | 0% | 0.1 | 90.6 | 1.2 | 0 | structure |
| 164 | `src/__tests__/lib/domain-filter.test.ts` | 72 | 0 | 1 | 0% | 0.22 | 90.6 | 1.2 | 0 | structure |
| 165 | `src/__tests__/lib/auth-fallback.test.ts` | 43 | 0 | 2 | 0% | 0.19 | 90.7 | 2.9 | 0 | structure |
| 166 | `src/__tests__/lib/order-cache.test.ts` | 48 | 0 | 3 | 0% | 0.13 | 90.7 | 1.2 | 0 | structure |
| 167 | `src/__tests__/api/health.redis.connected.test.ts` | 47 | 0 | 3 | 0% | 0.13 | 90.8 | 1.2 | 0 | structure |
| 168 | `src/__tests__/components/ui/ProductCard.test.tsx` | 96 | 0 | 2 | 0% | 0.16 | 90.8 | 1.2 | 0 | structure |
| 169 | `src/__tests__/lib/constants.test.ts` | 86 | 0 | 1 | 0% | 0.21 | 90.9 | 2.9 | 0 | structure |
| 170 | `src/__tests__/api/categories.slug.products.test.ts` | 99 | 0 | 4 | 0% | 0.09 | 90.9 | 1.2 | 0 | structure |
| 171 | `src/__tests__/lib/redis-cache.redis-path.test.ts` | 122 | 0 | 3 | 0% | 0.12 | 90.9 | 1.2 | 0 | structure |
| 172 | `src/lib/cache.ts` | 22 | 1 | 0 | 0% | 0.32 | 95.8 | 3 | 0 | structure |
| 173 | `src/__tests__/api/auth.login.test.ts` | 132 | 0 | 4 | 0% | 0.08 | 91.2 | 2.9 | 0 | structure |
| 174 | `src/__tests__/api/auth.logout.test.ts` | 25 | 0 | 4 | 0% | 0.16 | 91.2 | 1.2 | 0 | structure |
| 175 | `src/__tests__/components/ui/StockBadge.test.tsx` | 51 | 0 | 1 | 0% | 0.2 | 91.2 | 1.2 | 0 | structure |
| 176 | `src/__tests__/components/cart/CartProvider.test.tsx` | 337 | 0 | 1 | 0% | 0.19 | 91.5 | 2.9 | 0 | structure |
| 177 | `src/__tests__/components/ui/ToastProvider.test.tsx` | 107 | 0 | 1 | 0% | 0.19 | 91.5 | 2.9 | 0 | structure |
| 178 | `src/__tests__/lib/list-query.test.ts` | 111 | 0 | 1 | 0% | 0.19 | 91.5 | 2.9 | 0 | structure |
| 179 | `src/lib/hooks/useAdminHeaderActions.ts` | 50 | 2 | 3 | 0% | 0.1 | 91.5 | 2.9 | 0 | structure |
| 180 | `src/__tests__/lib/rate-limiter.test.ts` | 71 | 0 | 1 | 0% | 0.18 | 91.8 | 2.9 | 0 | structure |
| 181 | `src/components/ui/ShippingNudgePopup.tsx` | 79 | 4 | 4 | 0% | 0.06 | 91.8 | 2.9 | 0 | structure |
| 182 | `app/api/orders/[id]/status/route.ts` | 39 | 1 | 4 | 0% | 0.05 | 92.4 | 2.9 | 0 | structure |
| 183 | `src/__tests__/lib/cart-cookie.test.ts` | 228 | 0 | 2 | 0% | 0.1 | 92.6 | 2.9 | 0 | structure |
| 184 | `src/__tests__/lib/razorpay-server.test.ts` | 189 | 0 | 1 | 0% | 0.14 | 93 | 2.9 | 0 | structure |
| 185 | `src/__tests__/lib/api-client.test.ts` | 94 | 0 | 1 | 0% | 0.12 | 93.6 | 2.9 | 0 | structure |
| 186 | `src/__tests__/lib/validate.test.ts` | 38 | 0 | 1 | 0% | 0.16 | 93.6 | 2.9 | 0 | structure |
| 187 | `src/lib/hooks/useShippingNudge.ts` | 65 | 5 | 1 | 0% | 0.12 | 93.6 | 2.9 | 0 | structure |
| 188 | `app/api/auth/logout/route.ts` | 12 | 1 | 2 | 0% | 0.17 | 94.4 | 2.9 | 0 | structure |
| 189 | `src/lib/order-cache.ts` | 25 | 9 | 2 | 0% | 0.08 | 94.4 | 2.9 | 0 | structure |
| 190 | `src/components/ui/ReturnsPolicyModal.tsx` | 62 | 2 | 1 | 0% | 0.08 | 94.8 | 2.9 | 0 | structure |
| 191 | `app/api/auth/me/route.ts` | 11 | 1 | 1 | 0% | 0.18 | 96 | 2.9 | 0 | structure |
| 192 | `app/api/categories/latest/route.ts` | 24 | 1 | 1 | 0% | 0.08 | 96.1 | 2.9 | 0 | structure |
| 193 | `src/lib/hooks/useResponsivePageSize.ts` | 36 | 2 | 0 | 0% | 0.14 | 97 | 2.9 | 0 | structure |
| 194 | `src/lib/validate.ts` | 40 | 8 | 0 | 0% | 0.08 | 98.1 | 2.9 | 0 | structure |
| 195 | `src/__tests__/lib/hooks/useAdminSession.test.ts` | 71 | 0 | 2 | 0% | 0.14 | 91.4 | 1.2 | 0 | structure |
| 196 | `src/__tests__/components/ui/ShippingNudgePopup.test.tsx` | 129 | 0 | 2 | 0% | 0.13 | 91.7 | 1.2 | 0 | structure |
| 197 | `src/__tests__/components/ui/ComplementaryGiftPopup.test.tsx` | 138 | 0 | 1 | 0% | 0.18 | 91.8 | 1.2 | 0 | structure |
| 198 | `src/__tests__/lib/category-schemas.test.ts` | 93 | 0 | 1 | 0% | 0.18 | 91.8 | 1.2 | 0 | structure |
| 199 | `scripts/run-fallow-report.mjs` | 44 | 0 | 0 | 0% | 0.3 | 92.1 | 2 | 0 | structure |
| 200 | `src/__tests__/components/order/CheckoutProgress.test.tsx` | 64 | 0 | 1 | 0% | 0.17 | 92.1 | 1.2 | 0 | structure |

---

## 5. Refactoring Targets (9)

Sorted by **ROI score** (quick-win efficiency, descending). **Pri** is the absolute priority weight (efficiency × effort) — a high effort can push a medium ROI target up.

| # | ROI | Pri | File | Category | Effort | Confidence | Recommendation | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 12.2 | 24.3 | `src/lib/env.ts` | split high impact | medium | medium | Split high-impact file (23 LOC), 4 dependents amplify every change | [ ] |
| 2 | 9.7 | 19.3 | `src/components/order/OrderDetailModal.tsx` | extract complex functions | medium | high | Extract OrderDetailModal (cognitive: 34) in 311-LOC file into smaller functions | [ ] |
| 3 | 9.5 | 19 | `src/components/pages/catalogue-content.tsx` | extract complex functions | medium | high | Extract CatalogueContent (cognitive: 51) in 390-LOC file into smaller functions | [ ] |
| 4 | 8.9 | 26.8 | `src/lib/redis-cache.ts` | split high impact | high | medium | Split high-impact file (52 LOC), 11 dependents amplify every change | [ ] |
| 5 | 7.5 | 22.5 | `src/lib/query-keys.ts` | split high impact | high | medium | Split high-impact file (42 LOC), 4 dependents amplify every change | [ ] |
| 6 | 6.1 | 18.4 | `src/components/admin/AdminCataloguePanel.tsx` | extract complex functions | high | high | Extract AdminCataloguePanel (cognitive: 33) in 511-LOC file into smaller functions | [ ] |
| 7 | 5.9 | 17.7 | `src/lib/order-intake.ts` | extract complex functions | high | high | Extract order (cognitive: 64) in 509-LOC file into smaller functions | [ ] |
| 8 | 5.2 | 15.6 | `scripts/analyze-lighthouse.mjs` | extract complex functions | high | high | Extract analyzeRun (cognitive: 39) in 214-LOC file into smaller functions | [ ] |
| 9 | 5 | 9.9 | `scripts/generate-seed-from-excel.ts` | add test coverage | medium | high | 12 complex functions lack test coverage path, add tests before modifying | [ ] |

### Target details

#### 24.3 — `src/lib/env.ts`

*ROI 12.2 · Pri 24.3*

- **Category:** split high impact · **Effort:** medium · **Confidence:** medium
- **Recommendation:** Split high-impact file (23 LOC), 4 dependents amplify every change
- **Consumers:** `src/__tests__/lib/auth-fallback.test.ts`, `src/__tests__/setup.ts`, `src/lib/auth.ts`, `src/lib/prisma.ts`

#### 19.3 — `src/components/order/OrderDetailModal.tsx`

*ROI 9.7 · Pri 19.3*

- **Category:** extract complex functions · **Effort:** medium · **Confidence:** high
- **Recommendation:** Extract OrderDetailModal (cognitive: 34) in 311-LOC file into smaller functions
- **Consumers:** `app/admin/page.tsx`, `app/track/page.tsx`, `src/__tests__/components/order/OrderDetailModal.test.tsx`

#### 19 — `src/components/pages/catalogue-content.tsx`

*ROI 9.5 · Pri 19*

- **Category:** extract complex functions · **Effort:** medium · **Confidence:** high
- **Recommendation:** Extract CatalogueContent (cognitive: 51) in 390-LOC file into smaller functions
- **Consumers:** `app/catalogue/page.tsx`, `src/__tests__/components/pages/catalogue-pagination.test.tsx`

#### 26.8 — `src/lib/redis-cache.ts`

*ROI 8.9 · Pri 26.8*

- **Category:** split high impact · **Effort:** high · **Confidence:** medium
- **Recommendation:** Split high-impact file (52 LOC), 11 dependents amplify every change
- **Consumers:** `src/__tests__/api/categories.latest.test.ts`, `src/__tests__/api/categories.slug.products.test.ts`, `src/__tests__/api/categories.test.ts`, `src/__tests__/api/orders.id.test.ts`, `src/__tests__/api/stats.test.ts`

#### 22.5 — `src/lib/query-keys.ts`

*ROI 7.5 · Pri 22.5*

- **Category:** split high impact · **Effort:** high · **Confidence:** medium
- **Recommendation:** Split high-impact file (42 LOC), 4 dependents amplify every change
- **Consumers:** `src/__tests__/lib/hooks/useAdminMutations.test.tsx`, `src/__tests__/lib/query-keys.test.ts`, `src/lib/hooks/useAdminData.ts`, `src/lib/hooks/useAdminMutations.ts`

#### 18.4 — `src/components/admin/AdminCataloguePanel.tsx`

*ROI 6.1 · Pri 18.4*

- **Category:** extract complex functions · **Effort:** high · **Confidence:** high
- **Recommendation:** Extract AdminCataloguePanel (cognitive: 33) in 511-LOC file into smaller functions
- **Consumers:** `app/admin/page.tsx`, `src/__tests__/components/admin/AdminCataloguePanel.test.tsx`

#### 17.7 — `src/lib/order-intake.ts`

*ROI 5.9 · Pri 17.7*

- **Category:** extract complex functions · **Effort:** high · **Confidence:** high
- **Recommendation:** Extract order (cognitive: 64) in 509-LOC file into smaller functions
- **Consumers:** `app/api/orders/[id]/status/route.ts`, `app/api/orders/route.ts`, `src/__tests__/lib/order-fulfilment.test.ts`, `src/__tests__/lib/order-intake.test.ts`

#### 15.6 — `scripts/analyze-lighthouse.mjs`

*ROI 5.2 · Pri 15.6*

- **Category:** extract complex functions · **Effort:** high · **Confidence:** high
- **Recommendation:** Extract analyzeRun (cognitive: 39) in 214-LOC file into smaller functions

#### 9.9 — `scripts/generate-seed-from-excel.ts`

*ROI 5 · Pri 9.9*

- **Category:** add test coverage · **Effort:** medium · **Confidence:** high
- **Recommendation:** 12 complex functions lack test coverage path, add tests before modifying


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
