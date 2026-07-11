> **Generated:** ~June 20, 2026 | **Snapshot report** — reflects codebase state at that date. Metrics will drift as the codebase evolves.

> ⚠️ **HISTORICAL SNAPSHOT — NOT CURRENT.** This report was generated against a much earlier codebase. As of **July 12, 2026**, 50+ commits have landed since this snapshot, including the Razorpay migration (replacing PhonePe), `compareAtPrice` discounts, product/category `isActive` toggles, category management, Vercel Analytics, gallery, dynamic product `generateMetadata`, OOS handling, and the `app/globals.css` → 26-file CSS decomposition under `app/styles/`. All complexity, duplication, and dead-code metrics below are **stale** and must be regenerated with `fallow` before being relied upon.

## Fallow: 10 issues found

### Unused exports (8)

- `src/lib/api/client.ts`
  - :16 `ValidationError`
  - :26 `NetworkError`
- `src/lib/api/schemas.ts`
  - :51 `TrackOrderResultSchema`
  - :88 `CatalogueProductSchema`
  - :104 `StatsSchema`
  - :115 `ChartPointSchema`
  - :121 `ProductSalesSchema`
- `src/lib/auth.ts`
  - :31 `verifyToken`

### Unused dependencies (2)

- `pg`
- `sharp`

## Fallow: 15 clone groups found (2.5% duplication)

### Duplicates

**Clone group 1** (19 lines, 2 instances)

- `app/admin/error.tsx:16-34`
- `app/admin/not-found.tsx:4-22`

**Clone group 2** (12 lines, 3 instances)

- `app/admin/error.tsx:16-27`
- `app/admin/loading.tsx:2-13`
- `app/admin/not-found.tsx:4-15`

**Clone group 3** (20 lines, 5 instances)

- `app/api/auth/login/route.ts:32-39`
- `app/api/orders/%5Bid%5D/status/route.ts:77-84`
- `app/api/orders/route.ts:85-104`
- `app/api/products/%5Bid%5D/route.ts:60-72`
- `app/api/products/route.ts:106-117`

**Clone group 4** (13 lines, 2 instances)

- `app/api/export/route.ts:6-18`
- `scripts/export-to-excel.ts:13-20`

**Clone group 5** (21 lines, 2 instances)

- `app/api/export/route.ts:25-36`
- `scripts/export-to-excel.ts:31-51`

**Clone group 6** (15 lines, 2 instances)

- `app/api/export/route.ts:110-124`
- `scripts/export-to-excel.ts:99-113`

**Clone group 7** (15 lines, 2 instances)

- `app/api/orders/%5Bid%5D/status/route.ts:63-77`
- `app/api/products/%5Bid%5D/route.ts:46-60`

**Clone group 8** (13 lines, 3 instances)

- `app/api/orders/%5Bid%5D/status/route.ts:63-75`
- `app/api/products/%5Bid%5D/route.ts:46-58`
- `app/api/products/%5Bid%5D/route.ts:85-97`

**Clone group 9** (9 lines, 2 instances)

- `app/api/products/%5Bid%5D/route.ts:60-68`
- `app/api/products/route.ts:106-114`

**Clone group 10** (12 lines, 2 instances)

- `app/order/page.tsx:60-71`
- `app/order/page.tsx:91-102`

**Clone group 11** (6 lines, 3 instances)

- `app/order/page.tsx:60-65`
- `app/order/page.tsx:91-96`
- `app/order/page.tsx:134-139`

**Clone group 12** (14 lines, 2 instances)

- `app/order/page.tsx:146-159`
- `app/order/page.tsx:162-175`

**Clone group 13** (10 lines, 2 instances)

- `scripts/export-to-excel.ts:69-78`
- `scripts/export-to-excel.ts:89-98`

**Clone group 14** (9 lines, 2 instances)

- `scripts/export-to-excel.ts:70-78`
- `scripts/export-to-excel.ts:118-126`

**Clone group 15** (8 lines, 2 instances)

- `src/components/order/ConfirmationDetails.tsx:106-113`
- `src/components/order/ConfirmationDetails.tsx:138-145`

### Clone Families

**Family 1** (1 group, 12 lines across `app/admin/error.tsx`, `app/admin/loading.tsx`, `app/admin/not-found.tsx`)

- Extract shared function (12 lines) from error.tsx, loading.tsx, not-found.tsx (~24 lines saved)

**Family 2** (1 group, 19 lines across `app/admin/error.tsx`, `app/admin/not-found.tsx`)

- Extract shared function (19 lines) from error.tsx, not-found.tsx (~19 lines saved)

**Family 3** (1 group, 20 lines across `app/api/auth/login/route.ts`, `app/api/orders/%5Bid%5D/status/route.ts`, `app/api/orders/route.ts`, `app/api/products/%5Bid%5D/route.ts`, `app/api/products/route.ts`)

- Extract shared function (20 lines) from route.ts, route.ts, route.ts, route.ts, route.ts (~80 lines saved)

**Family 4** (3 groups, 49 lines across `app/api/export/route.ts`, `scripts/export-to-excel.ts`)

- Extract shared function (15 lines) from route.ts, export-to-excel.ts (~15 lines saved)
- Extract shared function (13 lines) from route.ts, export-to-excel.ts (~13 lines saved)
- Extract shared function (21 lines) from route.ts, export-to-excel.ts (~21 lines saved)

**Family 5** (2 groups, 28 lines across `app/api/orders/%5Bid%5D/status/route.ts`, `app/api/products/%5Bid%5D/route.ts`)

- Extract shared function (15 lines) from route.ts, route.ts (~15 lines saved)
- Extract shared function (13 lines) from route.ts, route.ts, route.ts (~26 lines saved)

**Family 6** (1 group, 9 lines across `app/api/products/%5Bid%5D/route.ts`, `app/api/products/route.ts`)

- Extract shared function (9 lines) from route.ts, route.ts (~9 lines saved)

**Family 7** (3 groups, 32 lines across `app/order/page.tsx`)

- Extract shared function (14 lines) from page.tsx, page.tsx (~14 lines saved)
- Extract shared function (12 lines) from page.tsx, page.tsx (~12 lines saved)
- Extract shared function (6 lines) from page.tsx, page.tsx, page.tsx (~12 lines saved)

**Family 8** (2 groups, 19 lines across `scripts/export-to-excel.ts`)

- Extract shared function (10 lines) from export-to-excel.ts, export-to-excel.ts (~10 lines saved)
- Extract shared function (9 lines) from export-to-excel.ts, export-to-excel.ts (~9 lines saved)

**Family 9** (1 group, 8 lines across `src/components/order/ConfirmationDetails.tsx`)

- Extract shared function (8 lines) from ConfirmationDetails.tsx, ConfirmationDetails.tsx (~8 lines saved)

**Summary:** 339 duplicated lines (2.5%) across 12 files

## Vital Signs

| Metric | Value |
|:-------|------:|
| Total LOC | 13711 |
| Avg Cyclomatic | 2.2 |
| P90 Cyclomatic | 5 |
| Dead Files | 0.0% |
| Dead Exports | 4.2% |
| Maintainability (avg) | 93.8 |
| Hotspots (since 6 months) | 0 |
| Circular Deps | 0 |
| Unused Deps | 2 |

## Fallow: 53 high complexity functions

| File | Function | Severity | Cyclomatic | Cognitive | CRAP | Lines |
|:-----|:---------|:---------|:-----------|:----------|:-----|:------|
| `src/components/order/OrderDetailModal.tsx:21` | `OrderDetailModal` | critical | 22 **!** | 22 **!** | 506.0 **!** | 200 |
| `src/lib/api/client.ts:83` | `apiFetch` | critical | 15 | 17 **!** | 240.0 **!** | 62 |
| `src/components/layout/Navbar.tsx:10` | `Navbar` | moderate | 14 | 24 **!** | - | 167 |
| `app/admin/useAdminPageState.ts:17` | `useAdminPageState` | critical | 13 | 23 **!** | 182.0 **!** | 74 |
| `app/order/page.tsx:91` | `DeliveryDetailsStep` | critical | 13 | 13 | 182.0 **!** | 42 |
| `app/admin/page.tsx:15` | `AdminPage` | critical | 12 | 12 | 156.0 **!** | 101 |
| `src/lib/hooks/useAdminCatalogueController.ts:109` | `handleProductSave` | critical | 12 | 10 | 156.0 **!** | 34 |
| `app/api/orders/%5Bid%5D/status/route.ts:62` | `PATCH` | critical | 11 | 11 | 132.0 **!** | 58 |
| `app/track/page.tsx:11` | `TrackPage` | critical | 10 | 18 **!** | 110.0 **!** | 143 |
| `src/lib/csrf.ts:6` | `validateCsrfOrigin` | critical | 10 | 10 | 110.0 **!** | 15 |
| `app/docs/page.tsx:98` | `EndpointCard` | critical | 10 | 6 | 110.0 **!** | 28 |
| `app/api/auth/login/route.ts:13` | `POST` | critical | 10 | 8 | 110.0 **!** | 58 |
| `app/api/track/route.ts:61` | `GET` | critical | 10 | 10 | 110.0 **!** | 36 |
| `src/components/admin/AdminCataloguePanel.tsx:130` | `ProductRow` | critical | 10 | 10 | 110.0 **!** | 43 |
| `app/order/page.tsx:60` | `PersonalDetailsStep` | critical | 10 | 10 | 110.0 **!** | 30 |
| `app/track/page.tsx:21` | `handleSearch` | high | 9 | 11 | 90.0 **!** | 32 |
| `app/api/export/route.ts:163` | `GET` | high | 8 | 7 | 72.0 **!** | 72 |
| `app/api/products/route.ts:81` | `buildCreateData` | high | 8 | 7 | 72.0 **!** | 12 |
| `src/components/order/ConfirmationDetails.tsx:32` | `generateInvoice` | high | 8 | 8 | 72.0 **!** | 226 |
| `app/api/orders/route.ts:107` | `order` | high | 8 | 10 | 72.0 **!** | 91 |
| `app/api/stats/route.ts:9` | `GET` | high | 8 | 8 | 72.0 **!** | 100 |
| `app/order/page.tsx:327` | `handleSubmit` | high | 8 | 10 | 72.0 **!** | 38 |
| `src/components/providers/QueryProvider.tsx:13` | `retry` | high | 7 | 4 | 56.0 **!** | 6 |
| `app/api/products/route.ts:22` | `GET` | high | 7 | 6 | 56.0 **!** | 47 |
| `app/api/orders/route.ts:79` | `POST` | high | 7 | 10 | 56.0 **!** | 143 |
| `src/components/pages/catalogue-content.tsx:16` | `CatalogueContent` | high | 7 | 14 | 56.0 **!** | 86 |
| `app/docs/page.tsx:59` | `schemaLabel` | moderate | 6 | 5 | 42.0 **!** | 6 |
| `src/lib/hooks/useAdminSession.ts:7` | `useAdminSession` | moderate | 6 | 7 | 42.0 **!** | 21 |
| `src/components/layout/Footer.tsx:11` | `ContactIcon` | moderate | 6 | 1 | 42.0 **!** | 40 |
| `src/components/admin/AdminCataloguePanel.tsx:230` | `SubmitButton` | moderate | 6 | 7 | 42.0 **!** | 9 |
| `src/lib/hooks/useAdminOrdersController.ts:30` | `handleAdvance` | moderate | 6 | 5 | 42.0 **!** | 22 |
| `src/lib/hooks/useAdminCatalogueController.ts:51` | `productToFormState` | moderate | 6 | 5 | 42.0 **!** | 13 |
| `proxy.ts:9` | `proxy` | moderate | 6 | 6 | 42.0 **!** | 23 |
| `src/components/order/OrderSummaryCard.tsx:23` | `OrderSummaryCard` | moderate | 6 | 6 | 42.0 **!** | 114 |
| `app/api/orders/route.ts:39` | `GET` | moderate | 6 | 5 | 42.0 **!** | 38 |
| `app/order/page.tsx:134` | `PaymentStep` | moderate | 6 | 7 | 42.0 **!** | 99 |
| `app/api/export/route.ts:38` | `batchedFetch` | moderate | 5 | 7 | 30.0 **!** | 18 |
| `app/api/export/route.ts:65` | `<arrow>` | moderate | 5 | 7 | 30.0 **!** | 12 |
| `app/api/products/route.ts:95` | `POST` | moderate | 5 | 4 | 30.0 **!** | 32 |
| `app/docs/page.tsx:80` | `<arrow>` | moderate | 5 | 4 | 30.0 **!** | 14 |
| `app/docs/page.tsx:66` | `renderSchema` | moderate | 5 | 5 | 30.0 **!** | 31 |
| `app/admin/login/page.tsx:19` | `handleSubmit` | moderate | 5 | 5 | 30.0 **!** | 21 |
| `src/lib/api/client.ts:44` | `buildHeaders` | moderate | 5 | 5 | 30.0 **!** | 14 |
| `src/lib/api/client.ts:59` | `readErrorBody` | moderate | 5 | 5 | 30.0 **!** | 15 |
| `app/api/products/%5Bid%5D/route.ts:45` | `PUT` | moderate | 5 | 4 | 30.0 **!** | 37 |
| `src/components/admin/AdminOrdersPanel.tsx:85` | `<arrow>` | moderate | 5 | 3 | 30.0 **!** | 28 |
| `src/lib/csrf-helpers.ts:1` | `isAllowedDevOrigin` | moderate | 5 | 2 | 30.0 **!** | 4 |
| `src/components/order/OrderSummaryCard.tsx:69` | `<arrow>` | moderate | 5 | 4 | 30.0 **!** | 46 |
| `src/lib/utils.ts:7` | `extractApiErrorMessage` | moderate | 5 | 2 | 30.0 **!** | 6 |
| `app/order/page.tsx:50` | `runValidation` | moderate | 5 | 6 | 30.0 **!** | 9 |
| `app/order/page.tsx:282` | `OrderPage` | moderate | 5 | 11 | 30.0 **!** | 147 |
| `src/components/track/TrackOrderCard.tsx:11` | `TrackOrderCard` | moderate | 5 | 3 | 30.0 **!** | 50 |
| `src/lib/hooks/useAdminCatalogueController.ts:65` | `useAdminCatalogueController` | moderate | 4 | 18 **!** | - | 114 |

**101** files, **522** functions analyzed (thresholds: cyclomatic > 20, cognitive > 15, CRAP >= 30.0)

### File Health Scores (90 files)

| File | Maintainability | Fan-in | Fan-out | Dead Code | Density | Risk |
|:-----|:---------------|:-------|:--------|:----------|:--------|:-----|
| `src/components/order/OrderDetailModal.tsx` | 88.8 | 2 | 4 | 0% | 0.16 | 506.0 |
| `src/lib/api/client.ts` | 80.6 | 4 | 1 | 50% | 0.22 | 240.0 |
| `app/admin/useAdminPageState.ts` | 83.5 | 1 | 6 | 0% | 0.29 | 182.0 |
| `app/order/page.tsx` | 83.6 | 0 | 9 | 0% | 0.24 | 182.0 |
| `app/admin/page.tsx` | 86.2 | 0 | 11 | 0% | 0.13 | 156.0 |
| `src/lib/hooks/useAdminCatalogueController.ts` | 88.2 | 1 | 4 | 0% | 0.18 | 156.0 |
| `app/api/orders/%5Bid%5D/status/route.ts` | 89.1 | 0 | 3 | 0% | 0.18 | 132.0 |
| `app/track/page.tsx` | 87.1 | 0 | 6 | 0% | 0.17 | 110.0 |
| `app/api/track/route.ts` | 87.8 | 0 | 2 | 0% | 0.26 | 110.0 |
| `app/api/auth/login/route.ts` | 89.1 | 0 | 4 | 0% | 0.15 | 110.0 |
| `app/docs/page.tsx` | 90.9 | 0 | 1 | 0% | 0.21 | 110.0 |
| `src/lib/csrf.ts` | 91.2 | 6 | 1 | 0% | 0.48 | 110.0 |
| `src/components/admin/AdminCataloguePanel.tsx` | 92.1 | 1 | 1 | 0% | 0.17 | 110.0 |
| `app/api/products/route.ts` | 87.7 | 0 | 5 | 0% | 0.17 | 72.0 |
| `app/api/orders/route.ts` | 88.6 | 0 | 6 | 0% | 0.12 | 72.0 |
| `app/api/export/route.ts` | 90.2 | 0 | 2 | 0% | 0.18 | 72.0 |
| `app/api/stats/route.ts` | 90.9 | 0 | 3 | 0% | 0.12 | 72.0 |
| `src/components/order/ConfirmationDetails.tsx` | 97.9 | 1 | 0 | 0% | 0.07 | 72.0 |
| `src/components/pages/catalogue-content.tsx` | 88.1 | 1 | 7 | 0% | 0.12 | 56.0 |
| `src/components/providers/QueryProvider.tsx` | 91.5 | 1 | 0 | 0% | 0.30 | 56.0 |
| `src/lib/hooks/useAdminOrdersController.ts` | 88.6 | 1 | 5 | 0% | 0.14 | 42.0 |
| `src/lib/hooks/useAdminSession.ts` | 91.9 | 1 | 1 | 0% | 0.32 | 42.0 |
| `src/components/layout/Footer.tsx` | 95.1 | 1 | 1 | 0% | 0.07 | 42.0 |
| `proxy.ts` | 96.3 | 0 | 0 | 0% | 0.17 | 42.0 |
| `src/components/order/OrderSummaryCard.tsx` | 96.4 | 1 | 0 | 0% | 0.12 | 42.0 |
| `app/api/products/%5Bid%5D/route.ts` | 85.6 | 0 | 5 | 0% | 0.24 | 30.0 |
| `src/components/admin/AdminOrdersPanel.tsx` | 90.3 | 1 | 3 | 0% | 0.14 | 30.0 |
| `src/components/track/TrackOrderCard.tsx` | 92.6 | 1 | 2 | 0% | 0.10 | 30.0 |
| `app/admin/login/page.tsx` | 93.6 | 0 | 1 | 0% | 0.12 | 30.0 |
| `src/lib/csrf-helpers.ts` | 94.6 | 1 | 0 | 0% | 0.60 | 30.0 |
| `src/lib/utils.ts` | 96.4 | 4 | 0 | 0% | 0.50 | 30.0 |
| `prisma/seed.ts` | 93.3 | 0 | 1 | 0% | 0.13 | 20.0 |
| `src/components/admin/AdminDeleteConfirm.tsx` | 93.6 | 1 | 1 | 0% | 0.12 | 20.0 |
| `app/confirmation/%5Bid%5D/page.tsx` | 94.4 | 0 | 2 | 0% | 0.04 | 20.0 |
| `src/lib/rate-limiter.ts` | 95.8 | 1 | 0 | 0% | 0.21 | 20.0 |
| `src/components/layout/Navbar.tsx` | 88.7 | 1 | 2 | 0% | 0.23 | 14.0 |
| `src/lib/auth.ts` | 88.4 | 9 | 1 | 14% | 0.20 | 12.0 |
| `app/layout.tsx` | 88.7 | 0 | 9 | 0% | 0.07 | 12.0 |
| `src/lib/hooks/useAdminHeaderActions.ts` | 91.2 | 1 | 3 | 0% | 0.11 | 12.0 |
| `src/lib/api/index.ts` | 92.0 | 3 | 2 | 0% | 0.12 | 12.0 |
| `scripts/export-to-excel.ts` | 92.2 | 0 | 0 | 0% | 0.26 | 12.0 |
| `app/catalogue/page.tsx` | 92.5 | 0 | 2 | 0% | 0.11 | 12.0 |
| `src/components/admin/AdminTrackingModal.tsx` | 93.3 | 1 | 1 | 0% | 0.13 | 12.0 |
| `src/components/admin/AdminChartsSection.tsx` | 94.2 | 1 | 1 | 0% | 0.10 | 12.0 |
| `app/api/orders/%5Bid%5D/route.ts` | 95.4 | 0 | 1 | 0% | 0.10 | 12.0 |
| `src/components/admin/AdminHeader.tsx` | 98.2 | 1 | 0 | 0% | 0.07 | 12.0 |
| `src/lib/env.ts` | 98.2 | 2 | 0 | 0% | 0.17 | 12.0 |
| `src/lib/useFocusTrap.ts` | 92.9 | 4 | 0 | 0% | 0.24 | 7.3 |
| `src/components/ui/ToastProvider.tsx` | 93.4 | 7 | 0 | 0% | 0.22 | 6.1 |
| `src/lib/hooks/useAdminData.ts` | 90.2 | 3 | 2 | 0% | 0.18 | 6.0 |
| `src/components/admin/AdminStatsGrid.tsx` | 93.2 | 1 | 2 | 0% | 0.08 | 6.0 |
| `src/components/ui/ProductCard.tsx` | 94.2 | 1 | 1 | 0% | 0.10 | 6.0 |
| `app/api/auth/logout/route.ts` | 94.4 | 0 | 2 | 0% | 0.17 | 6.0 |
| `src/components/ui/ReturnsPolicyModal.tsx` | 94.8 | 2 | 1 | 0% | 0.08 | 6.0 |
| `src/components/order/CheckoutProgress.tsx` | 95.2 | 1 | 0 | 0% | 0.16 | 6.0 |
| `app/api/auth/me/route.ts` | 96.0 | 0 | 1 | 0% | 0.18 | 6.0 |
| `src/lib/prisma.ts` | 96.0 | 12 | 1 | 0% | 0.11 | 6.0 |
| `src/components/admin/AdminTabs.tsx` | 97.5 | 2 | 0 | 0% | 0.10 | 6.0 |
| `app/error.tsx` | 98.3 | 0 | 0 | 0% | 0.07 | 6.0 |
| `app/admin/error.tsx` | 98.5 | 0 | 0 | 0% | 0.05 | 6.0 |
| `src/lib/cart-cookie.ts` | 94.3 | 1 | 1 | 0% | 0.19 | 5.0 |
| `src/lib/hooks/useAdminMutations.ts` | 87.3 | 4 | 3 | 0% | 0.24 | 2.0 |
| `src/components/cart/CartProvider.tsx` | 90.6 | 4 | 1 | 0% | 0.22 | 4.0 |
| `src/components/ui/StatusBadge.tsx` | 94.8 | 3 | 1 | 0% | 0.21 | 4.0 |
| `src/lib/cache.ts` | 96.4 | 3 | 0 | 0% | 0.32 | 3.0 |
| `src/components/layout/NavCartDropdown.tsx` | 97.0 | 1 | 0 | 0% | 0.10 | 3.0 |
| `src/components/ui/StockBadge.tsx` | 98.2 | 1 | 0 | 0% | 0.19 | 3.0 |
| `src/lib/query-keys.ts` | 91.6 | 2 | 0 | 0% | 0.44 | 2.0 |
| `src/lib/hooks/useTrackSearch.ts` | 94.4 | 1 | 2 | 0% | 0.17 | 2.0 |
| `app/page.tsx` | 96.6 | 0 | 1 | 0% | 0.17 | 2.0 |
| `app/api/docs/route.ts` | 96.7 | 0 | 1 | 0% | 0.08 | 2.0 |
| `app/admin/loading.tsx` | 97.6 | 0 | 0 | 0% | 0.10 | 2.0 |
| `app/order/loading.tsx` | 98.3 | 0 | 0 | 0% | 0.07 | 2.0 |
| `app/catalogue/loading.tsx` | 98.7 | 0 | 0 | 0% | 0.06 | 2.0 |
| `src/components/ui/SectionHeader.tsx` | 98.8 | 2 | 0 | 0% | 0.09 | 2.0 |
| `src/components/ui/LoadingSpinner.tsx` | 98.9 | 2 | 0 | 0% | 0.07 | 2.0 |
| `app/sitemap.ts` | 99.3 | 0 | 0 | 0% | 0.03 | 2.0 |
| `app/admin/not-found.tsx` | 99.4 | 0 | 0 | 0% | 0.03 | 2.0 |
| `app/confirmation/%5Bid%5D/loading.tsx` | 99.4 | 0 | 0 | 0% | 0.07 | 2.0 |
| `app/docs/loading.tsx` | 99.4 | 0 | 0 | 0% | 0.11 | 2.0 |
| `app/loading.tsx` | 99.4 | 0 | 0 | 0% | 0.09 | 2.0 |
| `app/not-found.tsx` | 99.4 | 0 | 0 | 0% | 0.04 | 2.0 |
| `app/order/layout.tsx` | 99.4 | 0 | 0 | 0% | 0.08 | 2.0 |
| `app/track/layout.tsx` | 99.4 | 0 | 0 | 0% | 0.08 | 2.0 |
| `app/track/loading.tsx` | 99.4 | 0 | 0 | 0% | 0.06 | 2.0 |
| `src/components/layout/PageTransition.tsx` | 99.4 | 1 | 0 | 0% | 0.07 | 2.0 |
| `src/components/pages/home-content.tsx` | 99.4 | 1 | 0 | 0% | 0.02 | 2.0 |
| `next.config.ts` | 99.5 | 0 | 0 | 0% | 0.02 | 2.0 |
| `src/components/ui/AdminStatCard.tsx` | 99.4 | 1 | 0 | 0% | 0.03 | 1.0 |
| `src/lib/sanitize.ts` | 99.4 | 3 | 0 | 0% | 0.14 | 1.0 |

**Average maintainability index:** 93.8/100

### Refactoring Targets (2)

| Efficiency | Category | Effort / Confidence | File | Recommendation |
|:-----------|:---------|:--------------------|:-----|:---------------|
| 15.0 | dead code | medium / high | `src/lib/api/client.ts` | Remove 2 unused exports to reduce surface area (50% dead) |
| 10.2 | high impact | high / medium | `src/lib/csrf.ts` | Split high-impact file (21 LOC), 6 dependents amplify every change |

---

<details><summary>Metric definitions</summary>

- **MI**: Maintainability Index (0–100, higher is better)
- **Order**: risk-aware triage order using the larger of low-MI concern and CRAP risk
- **Fan-in**: files that import this file (blast radius)
- **Fan-out**: files this file imports (coupling)
- **Dead Code**: % of value exports with zero references
- **Density**: cyclomatic complexity / lines of code
- **Risk**: max CRAP score for the file; low <15, moderate 15-30, high >=30
- **Efficiency**: priority / effort (higher = better quick-win value, default sort)
- **Category**: recommendation type (churn+complexity, high impact, dead code, complexity, coupling, circular dep)
- **Effort**: estimated effort (low / medium / high) based on file size, function count, and fan-in
- **Confidence**: recommendation reliability (high = deterministic analysis, medium = heuristic, low = git-dependent)

[Full metric reference](https://docs.fallow.tools/explanations/metrics)

</details>
