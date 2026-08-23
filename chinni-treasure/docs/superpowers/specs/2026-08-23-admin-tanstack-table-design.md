# Admin Tables on TanStack Table v9 — Design

**Date:** 2026-08-23
**Status:** Approved design, pending implementation plan
**Scope:** Admin panel management surfaces — Orders, Categories, Catalogue

---

## Problem & Goal

The three admin management surfaces are built with hand-rolled tables/list markup that
duplicates loading/empty/sort-header concerns and offers no column sorting UX:

| Panel | Today |
|---|---|
| Catalogue | Rich server-driven `<table>`: filter selects (search, category, badge, status), sort dropdown, Prev/Next pagination, rich cells (image gallery lightbox, badges, bundling pill, stock health) |
| Categories | Small client-side `<table>`; no search, no sorting, no pagination |
| Orders | **Card list, not a table**; status tab filters + Prev/Next; click opens `OrderDetailModal` |

**Goal:** Adopt `@tanstack/react-table` (v9, headless) behind one shared table kit so all
three panels get consistent sortable-column UX while preserving every existing behavior,
endpoint contract, styling system (raw modular CSS only), and data-fetching pattern
(React Query v5 stays the single source of server state).

## Non-Goals

- No Tailwind or any component library — headless table + existing raw CSS in `app/styles/admin.css`
- No bulk selection / bulk status actions (possible future layer)
- No column pinning/resizing/visibility UI
- No change to mutation flows (status transitions keep `expectedVersion`, tracking-first rules)
- No redesign of the customer-facing storefront

## Dependency

- `@tanstack/react-table@^9.1.2` (peer `react >= 18`; compatible with React 19.2)

---

## Architecture

### Shared kit: `src/components/admin/table/`

```
table/
├── AdminDataTable.tsx        # generic presentational renderer
├── columns.catalogue.tsx     # ColumnDef[] for products (rich cells)
├── columns.orders.tsx        # ColumnDef[] for orders
└── columns.categories.tsx    # ColumnDef[] for categories
```

**`AdminDataTable<T>` props:** `{ table: Table<T>; isLoading?: boolean; skeletonRowCount?: number; emptyMessage: string }`.

Renders the existing `.admin-table` classes:

- `<thead>`: for each header column — plain `<th>` or a `<button class="th-sort-btn">` when
  `column.getCanSort()`, indicator via CSS (`data-sort="asc|desc"` on th, pure-CSS arrows),
  `aria-sort` attribute set accordingly.
- `<tbody>`: `table.getRowModel().rows.map(row => <tr>…flexRender(cells…)</tr>)`.
- Loading: N skeleton rows reusing existing skeleton-block classes.
- Empty: single row, `colSpan={visibleColumns.length}`, existing `empty-state` class.

Panels call `useReactTable` directly with mode-appropriate options (below); no extra hook layer.

### Data-flow rules (all panels)

- React Query owns fetching/caching/mutations exactly as today (keys unchanged:
  `orders.list(params)`, `products.list(params)`, `categories.list({includeInactive})`).
- TanStack Table owns **view state only**: sorting, global filter (client mode), and maps
  pagination to existing page state. It never fetches.

---

## Panel designs

### Catalogue — server mode

- Options: `manualSorting: true`, `manualPagination: true`, no built-in row models beyond core.
- **Sort adapter:** bidirectional map between TanStack sorting (`[{id, desc}]`) and the API's
  existing `sort` strings already accepted by `GET /api/products` (`newest|oldest|name-asc|name-desc|price-asc|price-desc|stock-desc|stock-asc|sku-asc|sku-desc`).
  Sortable columns: Name, Price (uses compare-aware price), Stock, Code, Created.
  The existing sort `<select>` remains and both stay in sync (select change sets table state;
  header click updates `filters.sort` via existing `onFilterChange`).
- Pagination: existing `page`/`onPageChange` state feeds `pagination` option + `pageCount`;
  existing `PaginationBar` stays.
- Filters/search/category/badge/status UI untouched; results still server-computed.
- Rich cells preserved: gallery lightbox trigger (panel-local `lightboxProduct` state passed
  via `table.options.meta`), image+count, price/MRP/discount, stock health badge, bundling pill,
  edit/delete actions with `loadingProductId`.

### Orders — server mode + backend addition

**Backend:** `GET /api/orders` gains an optional validated `sort` query param.

- Zod schema: `z.enum(["date-desc","date-asc","total-desc","total-asc"])`, default `date-desc`.
- Maps to whitelisted Prisma `orderBy`: createdAt desc/asc, totalAmount desc/asc. Invalid values → 400 (schema-driven, consistent with codebase validation rules).
- `fetchOrders` client + `OrdersListResponse` params extended; OpenAPI `/api/orders` GET documents the param; query key includes sort.

**Frontend:** cards become a real table.

- Columns: **Order # · Customer · Items · Total · Status · Date**. All status actions
  (advance / reject / tracking) remain inside `OrderDetailModal`, matching today's
  interaction model; row click opens the modal.
- Options: `manualSorting: true`, `manualPagination: true`.
- Status tab buttons remain the status filter mechanism (server-side via existing `status` param).
- Row click sets existing `selectedOrderId`; `advancingOrderId` pending styling moves to row-level class via meta.
- Default sort `date-desc` preserves current ordering.

### Categories — client mode

- Options: `getCoreRowModel`, `getSortedRowModel`, `getFilteredRowModel` (dataset is small and already fetched whole with `includeInactive: true`).
- Sortable columns: Name, Slug, Order (displayOrder), Products count, Status.
- New global search input above the table filters Name+Slug via `globalFilter` fn.
- Enable/Disable toggle (with `togglePendingId`), Edit, Delete-with-guard (blocked when `productCount > 0`) preserved as cell renderers; inline delete-confirm modal unchanged.

---

## Styling & Accessibility

- New styles appended to `app/styles/admin.css` (no new files needed): `.th-sort-btn`,
  `[data-sort]::after` arrow indicators using current tokens, hover/focus-visible states.
- `aria-sort` on sorted `<th>`; sort buttons have accessible labels ("Sort by Price").
- Visible focus rings retained (existing accessibility.css patterns apply).
- `prefers-reduced-motion` respected (no animated indicators).

## Error handling

Unchanged from today: React Query error states surface through existing mechanisms;
mutations show toasts via `useToast`; order transitions keep optimistic-concurrency
(`expectedVersion`) semantics; delete guards unchanged.

## Testing

- **AdminDataTable** (new tests): renders headers + rows from columnDefs; sortable header shows button + `aria-sort` toggling on click; loading renders skeleton rows; empty renders colSpan message.
- **Orders API route**: valid `sort` values produce expected orderBy (spy/assert), invalid value → 400; default remains date-desc.
- **Catalogue panel**: clicking Price header issues fetch with mapped `sort=price-asc/desc` (mock fetcher); select→header sync.
- **Categories panel**: search input narrows rows; header click sorts client-side; toggle/delete still callable.
- **Orders panel**: rows render from mocked React Query data; row click opens modal (selectedOrderId flow).
- All pre-existing admin tests updated where selectors changed; full suite must pass.

## Verification gate

`npm run typecheck` · `npm run test:run` · `npm run lint` · `npm run build`

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| v9 API churn (docs/examples skew v8) | Pin `^9.1.2`; verify against v9 reference during planning |
| Manual-cache patch in `useAdminMutations` assumes response shape | Do not alter products list response shape; patch keeps working |
| Markup-selector test breakage | Update tests in same commits as panel changes; keep class names stable |
| Orders cards→table changes muscle memory | Keep modal-on-click, tabs, pager identical; visual parity for status/date info |
