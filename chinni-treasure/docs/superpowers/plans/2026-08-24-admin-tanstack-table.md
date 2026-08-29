# Admin Tables on TanStack Table v9 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the three admin management surfaces (Orders, Catalogue, Categories) onto `@tanstack/react-table` v9 behind one shared table kit, adding server-side sorting to `/api/orders`.

**Architecture:** One generic presentational `AdminDataTable<T>` renders `.admin-table` markup from TanStack `Table<T>` instances; each panel builds its own `ColumnDef[]` and calls `useReactTable` directly. Orders and Catalogue run in server mode (`manualSorting` + `manualPagination`, view state only); Categories runs fully client-side. React Query remains the single source of server state; query keys stay unchanged except adding `sort` to orders params.

**Tech Stack:** `@tanstack/react-table@^8.21` (deviation: the spec's `^9.1.2` pin turned out to be a full API redesign incompatible with the approved design; user approved pinning to the latest v8, which matches the design's `useReactTable`/`SortingState` API), React 19, `@tanstack/react-query` v5, Zod 4, Vitest 4 + Testing Library, raw modular CSS (`app/styles/admin.css`).

**Spec:** `docs/superpowers/specs/2026-08-23-admin-tanstack-table-design.md`

## Global Constraints

- No Tailwind / component libraries — headless table + raw CSS appended to `app/styles/admin.css` only.
- Never modify tokens in `app/styles/variables.css`.
- Do not alter the products list response shape (`{ products, total, page, limit, totalPages }`) — `patchProductCache` in `src/lib/hooks/useAdminMutations.ts:51` depends on it.
- Mutation flows unchanged: order transitions keep `expectedVersion`, tracking-first rule for `packaging → shipped`, category delete guard stays.
- Customer-facing storefront untouched.
- All new API validation is Zod-schema-driven (`validateOr400` from `src/lib/validate`).
- Preserve visible focus rings, 44px tap targets, `prefers-reduced-motion`.
- Run verification from repo root: `npx vitest run <file>` for task-scoped checks; full gate at the end.
- Commit after every task with the message given in that task's final step.

---

### Task 1: Dependency + shared `AdminDataTable` kit + sort-header CSS

**Files:**
- Modify: `package.json` (add dependency)
- Create: `src/components/admin/table/AdminDataTable.tsx`
- Create: `src/__tests__/components/admin/table/AdminDataTable.test.tsx`
- Modify: `app/styles/admin.css` (append at end of file)

**Interfaces:**
- Consumes: `@tanstack/react-table` v9 primitives (`Table`, `Row`, `flexRender`).
- Produces: `AdminDataTable<T>` with props `{ table: Table<T>; isLoading?: boolean; skeletonRowCount?: number; emptyMessage: string; getRowProps?: (row: Row<T>) => React.HTMLAttributes<HTMLTableRowElement> }`. Also declares the global `ColumnMeta.label?: string` module augmentation that all later column files rely on.

- [ ] **Step 1: Install dependency**

```bash
npm install @tanstack/react-table@^9.1.2
```

Expected: installs cleanly against React 19.2 (peer `react >= 18`).

- [ ] **Step 2: Write the failing test**

Create `src/__tests__/components/admin/table/AdminDataTable.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
} from "@tanstack/react-table";
import AdminDataTable from "@/src/components/admin/table/AdminDataTable";

interface Row {
  id: number;
  name: string;
  qty: number;
}

const data: Row[] = [
  { id: 1, name: "Alpha", qty: 3 },
  { id: 2, name: "Beta", qty: 7 },
];

const baseColumns: ColumnDef<Row>[] = [
  { accessorKey: "name", header: "Name", meta: { label: "Name" } },
  { accessorKey: "qty", header: "Qty", enableSorting: false },
];

function StaticHarness(props: { emptyMessage?: string; data?: Row[] }) {
  const table = useReactTable({
    data: props.data ?? data,
    columns: baseColumns,
    getCoreRowModel: getCoreRowModel(),
  });
  return <AdminDataTable table={table} emptyMessage={props.emptyMessage ?? "Nothing here."} />;
}

describe("AdminDataTable", () => {
  it("renders headers and one row per data item", () => {
    render(<StaticHarness />);
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /name/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /qty/i })).toBeInTheDocument();
  });

  it("renders sortable header as button and toggles aria-sort on click", () => {
    function SortedHarness() {
      const table = useReactTable({
        data,
        columns: baseColumns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        enableSortingRemoval: false,
      });
      return <AdminDataTable table={table} emptyMessage="Nothing here." />;
    }
    render(<SortedHarness />);
    const nameHeader = screen.getByRole("columnheader", { name: /name/i });
    expect(nameHeader).not.toHaveAttribute("aria-sort");

    fireEvent.click(screen.getByRole("button", { name: /sort by name/i }));
    expect(screen.getByRole("columnheader", { name: /name/i })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );

    fireEvent.click(screen.getByRole("button", { name: /sort by name/i }));
    expect(screen.getByRole("columnheader", { name: /name/i })).toHaveAttribute(
      "aria-sort",
      "descending",
    );

    // Non-sortable column stays a plain th with no sort button.
    expect(screen.queryByRole("button", { name: /sort by qty/i })).not.toBeInTheDocument();
  });

  it("renders skeleton rows while loading", () => {
    function LoadingHarness() {
      const table = useReactTable({
        data,
        columns: baseColumns,
        getCoreRowModel: getCoreRowModel(),
      });
      return <AdminDataTable table={table} isLoading skeletonRowCount={4} emptyMessage="Nothing here." />;
    }
    const { container } = render(<LoadingHarness />);
    expect(container.querySelectorAll(".skeleton-text")).toHaveLength(4 * 2);
    expect(screen.queryByText("Alpha")).not.toBeInTheDocument();
  });

  it("renders empty-state row spanning all columns when no rows", () => {
    const { container } = render(<StaticHarness data={[]} emptyMessage="No matches." />);
    const emptyCell = screen.getByText("No matches.");
    expect(emptyCell).toHaveClass("empty-state");
    expect(emptyCell).toHaveAttribute("colspan", "2");
    expect(container.querySelectorAll("tbody tr")).toHaveLength(1);
  });

  it("applies getRowProps to body rows", () => {
    function PropsHarness() {
      const table = useReactTable({
        data,
        columns: baseColumns,
        getCoreRowModel: getCoreRowModel(),
      });
      return (
        <AdminDataTable
          table={table}
          emptyMessage="Nothing here."
          getRowProps={(row) => ({ "data-testid": `row-${row.original.id}` })}
        />
      );
    }
    render(<PropsHarness />);
    expect(screen.getByTestId("row-1")).toBeInTheDocument();
    expect(screen.getByTestId("row-2")).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/__tests__/components/admin/table/AdminDataTable.test.tsx`
Expected: FAIL — cannot resolve `@/src/components/admin/table/AdminDataTable`.

- [ ] **Step 4: Write the implementation**

Create `src/components/admin/table/AdminDataTable.tsx`:

```tsx
"use client";

import { flexRender, type Row, type Table } from "@tanstack/react-table";
import type { HTMLAttributes } from "react";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Accessible label used for "Sort by {label}" button names. */
    label?: string;
  }
}

interface Props<T> {
  table: Table<T>;
  isLoading?: boolean;
  skeletonRowCount?: number;
  emptyMessage: string;
  getRowProps?: (row: Row<T>) => HTMLAttributes<HTMLTableRowElement>;
}

export default function AdminDataTable<T>({
  table,
  isLoading = false,
  skeletonRowCount = 5,
  emptyMessage,
  getRowProps,
}: Props<T>) {
  const visibleColumns = table.getVisibleFlatColumns();

  return (
    <div className="admin-product-table-wrap">
      <table className="admin-table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const column = header.column;
                const sorted = column.getIsSorted();
                const label =
                  (column.columnDef.meta?.label as string | undefined) ?? String(column.id);
                const ariaSort =
                  sorted === "asc"
                    ? "ascending"
                    : sorted === "desc"
                      ? "descending"
                      : undefined;
                return (
                  <th key={header.id} data-sort={sorted || undefined} aria-sort={ariaSort}>
                    {column.getCanSort() ? (
                      <button
                        type="button"
                        className="th-sort-btn"
                        onClick={column.getToggleSortingHandler()}
                        aria-label={`Sort by ${label}`}
                      >
                        {flexRender(column.columnDef.header, header.getContext())}
                      </button>
                    ) : (
                      flexRender(column.columnDef.header, header.getContext())
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: skeletonRowCount }, (_, idx) => (
              <tr
                key={`skeleton-${idx}`}
                className="product-table-skeleton"
                style={{ animationDelay: `${idx * 0.06}s` }}
              >
                {visibleColumns.map((column) => (
                  <td key={column.id}>
                    <div className="skeleton-text" />
                  </td>
                ))}
              </tr>
            ))
          ) : table.getRowModel().rows.length === 0 ? (
            <tr>
              <td colSpan={visibleColumns.length} className="empty-state">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr key={row.id} {...getRowProps?.(row)}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
```

Note: if TypeScript rejects `RowData` in the augmentation, import it: `import type { RowData } from "@tanstack/react-table";` and reference it unqualified.

- [ ] **Step 5: Append sort-header CSS**

Append to the END of `app/styles/admin.css` (after the shipping-label responsive rules, ~line 2185):

```css
/* ── Sortable Table Headers ── */
.th-sort-btn {
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    cursor: pointer;
    font: inherit;
    letter-spacing: inherit;
    text-transform: inherit;
    color: inherit;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    transition: color var(--transition-fast) var(--ease-out);
}

.th-sort-btn:hover {
    color: var(--gold-deep);
}

.th-sort-btn:focus-visible {
    outline: 2px solid var(--gold);
    outline-offset: 2px;
    color: var(--gold-deep);
}

.admin-table th[data-sort] {
    color: var(--gold-deep);
}

.admin-table th[data-sort]::after {
    content: "↑";
    font-size: 0.7rem;
    margin-left: 2px;
}

.admin-table th[data-sort="desc"]::after {
    content: "↓";
}

@media (prefers-reduced-motion: reduce) {
    .th-sort-btn {
        transition: none;
    }
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run src/__tests__/components/admin/table/AdminDataTable.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/components/admin/table/AdminDataTable.tsx src/__tests__/components/admin/table/AdminDataTable.test.tsx app/styles/admin.css
git commit -m "feat(admin): add TanStack table kit with sortable headers"
```

---

### Task 2: `sort` query param on `GET /api/orders`

**Files:**
- Modify: `app/api/orders/route.ts` (GET handler, lines 46–84)
- Test: `src/__tests__/api/orders.test.ts`

**Interfaces:**
- Consumes: `validateOr400` (already imported at route line 8), `Prisma` namespace from `@prisma/client`.
- Produces: `GET /api/orders?sort=date-desc|date-asc|total-desc|total-asc` (default `date-desc`, invalid → 400). Task 3's client plumbing sends this param.

- [ ] **Step 1: Write the failing tests**

In `src/__tests__/api/orders.test.ts`, inside `describe("GET /api/orders")`, add:

```tsx
it("defaults to createdAt desc ordering", async () => {
  vi.mocked(prisma.order.findMany).mockResolvedValue([]);
  vi.mocked(prisma.order.count).mockResolvedValue(0);

  await GET(createNextRequest("/api/orders"));

  expect(prisma.order.findMany).toHaveBeenCalledWith(
    expect.objectContaining({ orderBy: { createdAt: "desc" } }),
  );
});

it("maps each valid sort value to a whitelisted orderBy", async () => {
  vi.mocked(prisma.order.findMany).mockResolvedValue([]);
  vi.mocked(prisma.order.count).mockResolvedValue(0);

  const cases: Array<[string, Record<string, string>]> = [
    ["date-asc", { createdAt: "asc" }],
    ["total-desc", { totalAmount: "desc" }],
    ["total-asc", { totalAmount: "asc" }],
  ];
  for (const [param, expectedOrderBy] of cases) {
    vi.mocked(prisma.order.findMany).mockClear();
    await GET(createNextRequest(`/api/orders?sort=${param}`));
    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: expectedOrderBy }),
    );
  }
});

it("returns 400 for an invalid sort value", async () => {
  const response = await GET(createNextRequest("/api/orders?sort=bogus"));
  expect(response.status).toBe(400);
  expect(prisma.order.findMany).not.toHaveBeenCalled();
});
```

Adjust the import line at the top of the describe block if `GET` isn't already imported — it is (the file already tests GET).

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/api/orders.test.ts`
Expected: FAIL — `orderBy` assertion fails (currently hardcoded `{ createdAt: "desc" }` passes the first test but `sort=bogus` returns 200, failing the 400 test).

- [ ] **Step 3: Implement**

In `app/api/orders/route.ts`, add near the top (after existing imports):

```ts
const ORDERS_LIST_SCHEMA = z.object({
  sort: z
    .enum(["date-desc", "date-asc", "total-desc", "total-asc"])
    .default("date-desc"),
});

const ORDER_SORTS: Record<
  "date-desc" | "date-asc" | "total-desc" | "total-asc",
  Prisma.OrderOrderByWithRelationInput
> = {
  "date-desc": { createdAt: "desc" },
  "date-asc": { createdAt: "asc" },
  "total-desc": { totalAmount: "desc" },
  "total-asc": { totalAmount: "asc" },
};
```

(`Prisma` is imported from `@prisma/client` at route line 3; extend the import to `{ Prisma, ... }` if only `OrderStatus` etc. are named.)

Inside `GET`, after parsing `limit` and before `try {`:

```ts
const sortParse = validateOr400(ORDERS_LIST_SCHEMA, {
  sort: searchParams.get("sort") ?? undefined,
});
if (!sortParse.ok) return sortParse.response;
const sort = sortParse.data.sort;
```

Replace `orderBy: { createdAt: "desc" },` in the `findMany` call with:

```ts
orderBy: ORDER_SORTS[sort],
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/api/orders.test.ts`
Expected: PASS (all pre-existing GET/POST tests plus the three new ones).

- [ ] **Step 5: Commit**

```bash
git add app/api/orders/route.ts src/__tests__/api/orders.test.ts
git commit -m "feat(api): add validated sort param to GET /api/orders"
```

---

### Task 3: Orders client plumbing — fetcher, query key, OpenAPI

**Files:**
- Modify: `src/lib/api/index.ts` (`OrdersQueryParams` ~line 61, `fetchOrders` ~line 66)
- Modify: `src/lib/query-keys.ts` (orders.list params ~line 14)
- Modify: `src/lib/openapi-spec.ts` (`/api/orders` GET parameters array, ~lines 536–563)
- Test: `src/__tests__/lib/query-keys.test.ts`

**Interfaces:**
- Consumes: Task 2's backend contract.
- Produces: `OrdersQueryParams { page: number; limit: number; status?: string; sort?: string }` and query key shape `{ page, limit, status?, sort? }`. Task 4 consumes both.

- [ ] **Step 1: Update the query-key test**

In `src/__tests__/lib/query-keys.test.ts`, update the existing `"encodes orders list params in key"` test and add a sort case:

```ts
it("encodes orders list params in key", () => {
  const key = queryKeys.orders.list({ page: 2, limit: 10, status: "pending" });
  expect(key).toEqual([
    "chinni-treasure",
    "orders",
    "list",
    { page: 2, limit: 10, status: "pending" },
  ]);
});

it("encodes sort in orders list key when provided", () => {
  const key = queryKeys.orders.list({ page: 1, limit: 10, sort: "total-desc" });
  expect(key[3]).toEqual({ page: 1, limit: 10, sort: "total-desc" });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/__tests__/lib/query-keys.test.ts`
Expected: FAIL — `sort` missing from produced key.

- [ ] **Step 3: Implement**

`src/lib/query-keys.ts` — change the orders.list signature:

```ts
list: (params: { page: number; limit: number; status?: string; sort?: string }) =>
  [...queryKeys.orders.lists(), params] as const,
```

`src/lib/api/index.ts` — extend the interface and fetcher:

```ts
export interface OrdersQueryParams {
  page: number;
  limit: number;
  status?: string;
  sort?: string;
}

export function fetchOrders(params: OrdersQueryParams, signal?: AbortSignal) {
  const search = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });
  if (params.status && params.status !== "all") {
    search.set("status", params.status);
  }
  if (params.sort && params.sort !== "date-desc") {
    search.set("sort", params.sort);
  }
  return apiFetch<OrdersResponse>(`/api/orders?${search.toString()}`, {
    signal,
    schema: OrdersResponseSchema,
  });
}
```

(The default `date-desc` is omitted from the URL, mirroring how `fetchProducts` omits `sort=newest` at `api/index.ts:100`.)

`src/lib/openapi-spec.ts` — append to the `/api/orders` GET `parameters` array (after the `status` parameter, ~line 562):

```ts
{
  name: "sort",
  in: "query",
  schema: {
    type: "string",
    enum: ["date-desc", "date-asc", "total-desc", "total-asc"],
    default: "date-desc",
  },
  description: "Sort orders. date-* sorts by createdAt, total-* by totalAmount.",
},
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/__tests__/lib/query-keys.test.ts src/__tests__/lib/openapi-spec.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/api/index.ts src/lib/query-keys.ts src/lib/openapi-spec.ts src/__tests__/lib/query-keys.test.ts
git commit -m "feat(admin): thread orders sort param through client and API docs"
```

---

### Task 4: Orders panel — cards become a sortable table

**Files:**
- Create: `src/components/admin/table/columns.orders.tsx`
- Rewrite: `src/components/admin/AdminOrdersPanel.tsx`
- Modify: `app/admin/useAdminPageState.ts` (add `orderSort` state, pass to query and panel)
- Modify: `app/admin/page.tsx` (pass new props to `AdminOrdersPanel`)
- Modify: `app/styles/admin.css` (append row-state styles)
- Test: `src/__tests__/components/admin/AdminOrdersPanel.test.tsx`

**Interfaces:**
- Consumes: `AdminDataTable` (Task 1), `Order` type from `src/lib/api/schemas`, `StatusBadge` from `src/components/ui/StatusBadge`, `sort`/`onSortChange` props added here.
- Produces: `createOrderColumns(meta: OrdersTableMeta): ColumnDef<Order>[]` where `OrdersTableMeta = { onSelectOrder: (order: Order) => void }`. Panel props gain `sort: string; onSortChange: (sort: string) => void`.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/components/admin/AdminOrdersPanel.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AdminOrdersPanel from "@/src/components/admin/AdminOrdersPanel";
import type { Order } from "@/src/lib/api/schemas";

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "order-1",
    orderNumber: "ORD-001",
    customerName: "Ada Lovelace",
    customerEmail: "ada@example.com",
    customerPhone: "9999999999",
    status: "pending",
    totalAmount: 1234.5,
    subtotal: 1234.5,
    shippingCost: 0,
    createdAt: "2026-08-01T10:00:00.000Z",
    items: [
      {
        id: "item-1",
        productName: "Bracelet",
        unitPrice: 1234.5,
        quantity: 1,
      },
    ],
    addressLine1: "12 MG Road",
    city: "Bengaluru",
    stateCode: "KA",
    postalCode: "560001",
    ...overrides,
  } as Order;
}

const baseProps = {
  loading: false,
  statusFilter: "all",
  onStatusFilterChange: vi.fn(),
  currentPage: 1,
  totalPages: 1,
  onPageChange: vi.fn(),
  advancingOrderId: null,
  selectedOrder: null,
  onSelectOrder: vi.fn(),
  sort: "date-desc",
  onSortChange: vi.fn(),
};

describe("AdminOrdersPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders orders as table rows with required columns", () => {
    render(
      <AdminOrdersPanel
        {...baseProps}
        orders={[makeOrder(), makeOrder({ id: "order-2", orderNumber: "ORD-002", customerName: "Grace Hopper" })]}
      />,
    );
    expect(screen.getByRole("columnheader", { name: /order #/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /customer/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /items/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /total/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /status/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /date/i })).toBeInTheDocument();
    expect(screen.getByText("ORD-001")).toBeInTheDocument();
    expect(screen.getByText("Grace Hopper")).toBeInTheDocument();
  });

  it("opens the detail flow on row click", () => {
    const order = makeOrder();
    const onSelectOrder = vi.fn();
    render(<AdminOrdersPanel {...baseProps} orders={[order]} onSelectOrder={onSelectOrder} />);
    fireEvent.click(screen.getByTestId("order-row-order-1"));
    expect(onSelectOrder).toHaveBeenCalledWith(order);
  });

  it("does not open the modal while a transition is pending", () => {
    const onSelectOrder = vi.fn();
    render(
      <AdminOrdersPanel
        {...baseProps}
        orders={[makeOrder()]}
        onSelectOrder={onSelectOrder}
        advancingOrderId="order-1"
      />,
    );
    fireEvent.click(screen.getByTestId("order-row-order-1"));
    expect(onSelectOrder).not.toHaveBeenCalled();
  });

  it("header click reports the mapped sort value to onSortChange", () => {
    render(
      <AdminOrdersPanel
        {...baseProps}
        orders={[makeOrder()]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /sort by total/i }));
    expect(baseProps.onSortChange).toHaveBeenCalledWith("total-asc");
  });

  it("shows skeleton rows while loading", () => {
    const { container } = render(<AdminOrdersPanel {...baseProps} orders={[]} loading />);
    expect(container.querySelectorAll(".skeleton-text").length).toBeGreaterThan(0);
    expect(screen.queryByText(/ORD-/)).not.toBeInTheDocument();
  });

  it("keeps status tab buttons functional", () => {
    render(<AdminOrdersPanel {...baseProps} orders={[makeOrder()]} />);
    fireEvent.click(screen.getByRole("button", { name: "Pending" }));
    expect(baseProps.onStatusFilterChange).toHaveBeenCalledWith("pending");
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/__tests__/components/admin/AdminOrdersPanel.test.tsx`
Expected: FAIL — TS/build error: `sort`/`onSortChange` props do not exist; no `order-row-*` testids.

- [ ] **Step 3: Create the orders columns**

Create `src/components/admin/table/columns.orders.tsx`:

```tsx
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import StatusBadge from "@/src/components/ui/StatusBadge";
import type { Order } from "@/src/lib/api/schemas";

export interface OrdersTableMeta {
  onSelectOrder: (order: Order) => void;
}

export const ORDER_COLUMN_SORTS = {
  "order-number": { asc: "number-asc", desc: "number-desc" },
  createdAt: { asc: "date-asc", desc: "date-desc" },
  totalAmount: { asc: "total-asc", desc: "total-desc" },
} as const;

export type OrderSortKey = "date-desc" | "date-asc" | "total-desc" | "total-asc";

export function createOrderColumns(_meta: OrdersTableMeta): ColumnDef<Order>[] {
  void _meta;
  return [
    {
      id: "order-number",
      accessorKey: "orderNumber",
      header: "Order #",
      enableSorting: false,
      cell: ({ row }) => <span className="fw-500">{row.original.orderNumber}</span>,
    },
    {
      id: "customer",
      accessorKey: "customerName",
      header: "Customer",
      enableSorting: false,
      cell: ({ row }) => (
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: 180,
            display: "inline-block",
          }}
        >
          {row.original.customerName}
        </span>
      ),
    },
    {
      id: "items",
      header: "Items",
      enableSorting: false,
      cell: ({ row }) => row.original.items?.length ?? 0,
    },
    {
      id: "totalAmount",
      accessorFn: (row) => Number(row.totalAmount) || 0,
      header: "Total",
      meta: { label: "Total" },
      cell: ({ row }) => (
        <span className="order-card-price">₹{Number(row.original.totalAmount).toFixed(2)}</span>
      ),
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "createdAt",
      accessorFn: (row) => new Date(row.createdAt).getTime(),
      header: "Date",
      meta: { label: "Date" },
      cell: ({ row }) => (
        <time dateTime={row.original.createdAt}>
          {new Date(row.original.createdAt).toLocaleDateString("en-IN")}
        </time>
      ),
    },
  ];
}
```

Note: the backend (Task 2) only supports `date-*`/`total-*`; only Total and Date columns are sortable. Remove the unused `ORDER_COLUMN_SORTS` entry for `order-number` if you kept it — the final file should export only `OrdersTableMeta`, `OrderSortKey`, and `createOrderColumns`, with `enableSorting: false` everywhere except `totalAmount` and `createdAt`.

- [ ] **Step 4: Rewrite the panel**

Rewrite `src/components/admin/AdminOrdersPanel.tsx` (keeping the file's public contract: default export, same tab markup, same pager + scroll behavior):

```tsx
"use client";

import { useCallback, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  type SortingState,
  type OnChangeFn,
} from "@tanstack/react-table";
import AdminDataTable from "@/src/components/admin/table/AdminDataTable";
import {
  createOrderColumns,
  ORDER_SORT_TO_STATE,
  STATE_TO_ORDER_SORT,
  type OrderSortKey,
} from "@/src/components/admin/table/columns.orders";
import { ORDER_STATUS_FILTERS } from "@/src/lib/constants";
import type { Order } from "@/src/lib/api/schemas";

interface Props {
  orders: Order[];
  loading: boolean;
  statusFilter: string;
  onStatusFilterChange: (key: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  advancingOrderId: string | null;
  selectedOrder: Order | null;
  onSelectOrder: (order: Order | null) => void;
  sort: OrderSortKey;
  onSortChange: (sort: OrderSortKey) => void;
}

export default function AdminOrdersPanel({
  orders,
  loading,
  statusFilter,
  onStatusFilterChange,
  currentPage,
  totalPages,
  onPageChange,
  advancingOrderId,
  selectedOrder,
  onSelectOrder,
  sort,
  onSortChange,
}: Props) {
  const sorting = useMemo(() => ORDER_SORT_TO_STATE[sort] ?? [], [sort]);

  const handleSortingChange: OnChangeFn<SortingState> = useCallback(
    (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      const head = next[0];
      if (!head) {
        onSortChange("date-desc");
        return;
      }
      const base = STATE_TO_ORDER_SORT[head.id]; // "date-asc" | "total-asc"
      if (!base) return;
      onSortChange(head.desc ? (base.replace("-asc", "-desc") as OrderSortKey) : base);
    },
    [sorting, onSortChange],
  );

  const columns = useMemo(() => createOrderColumns({ onSelectOrder }), [onSelectOrder]);

  const table = useReactTable({
    data: orders,
    columns,
    state: { sorting },
    onSortingChange: handleSortingChange,
    manualSorting: true,
    manualPagination: true,
    pageCount: totalPages,
    getCoreRowModel: getCoreRowModel(),
  });

  const handlePageChange = useCallback(
    (page: number) => {
      onPageChange(page);
      const element = document.getElementById("panel-orders");
      if (element) element.scrollIntoView({ behavior: "smooth" });
    },
    [onPageChange],
  );

  return (
    <div id="panel-orders" role="tabpanel" aria-labelledby="tab-orders">
      <div className="filters-bar">
        {ORDER_STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            className={`btn btn-sm ${statusFilter === f.key ? "btn-primary" : "btn-secondary"}`}
            onClick={() => onStatusFilterChange(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <AdminDataTable
        table={table}
        isLoading={loading}
        skeletonRowCount={6}
        emptyMessage="No orders found."
        getRowProps={(row) => {
          const isAdvancing = advancingOrderId === row.original.id;
          const isSelected = selectedOrder?.id === row.original.id;
          return {
            "data-testid": `order-row-${row.original.id}`,
            className: `order-table-row${isAdvancing ? " order-table-row--advancing" : ""}${isSelected ? " order-table-row--selected" : ""}`,
            onClick: () => !isAdvancing && onSelectOrder(row.original),
            style: { cursor: isAdvancing ? "default" : "pointer" },
          };
        }}
      />

      {totalPages > 1 && (
        <div className="pagination-bar">
          <button
            className="btn btn-secondary btn-sm"
            disabled={currentPage <= 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            ← Prev
          </button>
          <span className="pagination-text">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            disabled={currentPage >= totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
```

Simplify the sort mapping — export two plain maps from `columns.orders.tsx` (alongside `createOrderColumns`):

```ts
import type { SortingState } from "@tanstack/react-table";

export const ORDER_SORT_TO_STATE: Record<OrderSortKey, SortingState> = {
  "date-desc": [{ id: "createdAt", desc: true }],
  "date-asc": [{ id: "createdAt", desc: false }],
  "total-desc": [{ id: "totalAmount", desc: true }],
  "total-asc": [{ id: "totalAmount", desc: false }],
};

export const STATE_TO_ORDER_SORT: Record<string, OrderSortKey> = {
  createdAt: "date-asc",
  totalAmount: "total-asc",
};
```

- [ ] **Step 5: Wire parent state**

In `app/admin/useAdminPageState.ts`:

```ts
import type { OrderSortKey } from "@/src/components/admin/table/columns.orders";

// near the other useState declarations (~line 34):
const [orderSort, setOrderSort] = useState<OrderSortKey>("date-desc");

// orders query (~line 45):
const ordersQuery = useAdminOrders(
  { page: currentPage, limit: ITEMS_PER_PAGE, status: statusFilter, sort: orderSort },
  authenticated,
);
```

Return `orderSort` and `setOrderSort` from the hook (follow wherever `statusFilter`/`setStatusFilter` are returned).

In `app/admin/page.tsx`, extend the `<AdminOrdersPanel>` usage (~line 70) with:

```tsx
sort={orderSort}
onSortChange={setOrderSort}
```

- [ ] **Step 6: Append row-state CSS**

Append to the end of `app/styles/admin.css`:

```css
/* ── Orders Table Rows ── */
.order-table-row {
    cursor: pointer;
}

.order-table-row--selected {
    background: rgba(212, 175, 55, 0.08);
}

.order-table-row--advancing {
    opacity: 0.85;
    cursor: default;
    pointer-events: none;
    animation: orderAdvanceShimmer 1.2s ease-in-out infinite;
}
```

(`orderAdvanceShimmer` keyframes already exist in admin.css — reused, not redefined. If the keyframes are defined with a different scope, define the animation as a simple `opacity` pulse instead.)

- [ ] **Step 7: Run tests**

Run: `npx vitest run src/__tests__/components/admin/AdminOrdersPanel.test.tsx src/__tests__/api/orders.test.ts src/components/order/__tests__/OrderDetailModal.test.tsx`
Expected: PASS — including the untouched modal tests (modal flow preserved).

- [ ] **Step 8: Commit**

```bash
git add src/components/admin/table/columns.orders.tsx src/components/admin/AdminOrdersPanel.tsx app/admin/useAdminPageState.ts app/admin/page.tsx app/styles/admin.css src/__tests__/components/admin/AdminOrdersPanel.test.tsx
git commit -m "feat(admin): convert orders panel from cards to sortable TanStack table"
```

---

### Task 5: Catalogue panel — server-mode sortable columns

**Files:**
- Create: `src/components/admin/table/columns.catalogue.tsx`
- Modify: `src/components/admin/AdminCataloguePanel.tsx` (replace hand-rolled thead/tbody/ProductRow/SkeletonRows with `AdminDataTable`; keep filters UI, summary bar, chips, lightbox, PaginationBar)
- Test: `src/__tests__/components/admin/catalogue-sort-adapter.test.ts`
- Test: `src/__tests__/components/admin/AdminCataloguePanel.test.tsx`

**Interfaces:**
- Consumes: `AdminDataTable` (Task 1), `ProductFilters` from `app/admin/useAdminPageState`, `Product` from `src/lib/api/schemas`, `FallbackImage`.
- Produces: `createCatalogueColumns(meta: CatalogueTableMeta): ColumnDef<Product>[]` with `CatalogueTableMeta = { loadingProductId: string | null; onPreviewImages: (p: Product) => void }`; plus pure mappers `apiSortToSorting(apiSort: string): SortingState` and `sortingToApiSort(sorting: SortingState): string`.

- [ ] **Step 1: Write the failing adapter tests**

Create `src/__tests__/components/admin/catalogue-sort-adapter.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { apiSortToSorting, sortingToApiSort } from "@/src/components/admin/table/columns.catalogue";

describe("catalogue sort adapter", () => {
  it("maps every API sort string to table state and back", () => {
    const apiSorts = [
      "newest", "oldest", "name-asc", "name-desc", "price-asc",
      "price-desc", "stock-desc", "stock-asc", "sku-asc", "sku-desc",
    ];
    for (const apiSort of apiSorts) {
      const sorting = apiSortToSorting(apiSort);
      const roundTripped = sorting.length === 0 ? "newest" : sortingToApiSort(sorting);
      expect(roundTripped).toBe(apiSort);
    }
  });

  it("returns empty sorting for the newest default", () => {
    expect(apiSortToSorting("newest")).toEqual([]);
  });

  it("returns newest for empty sorting state", () => {
    expect(sortingToApiSort([])).toBe("newest");
  });

  it("rejects unknown sort ids", () => {
    expect(sortingToApiSort([{ id: "hacker", desc: true }])).toBe("newest");
    expect(apiSortToSorting("bogus")).toEqual([]);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/__tests__/components/admin/catalogue-sort-adapter.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 2b: Write the panel header-click test**

Create `src/__tests__/components/admin/AdminCataloguePanel.test.tsx` — clicking the Price header must report the mapped API sort through `onFilterChange` (which is what drives the fetch):

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AdminCataloguePanel, {
  type ProductFormData,
} from "@/src/components/admin/AdminCataloguePanel";
import type { Product } from "@/src/lib/api/schemas";

const emptyForm: ProductFormData = {
  id: "",
  name: "",
  sku: "",
  description: "",
  price: "",
  compareAtPrice: "",
  stockQuantity: "",
  imageUrl: "",
  badge: "",
  categoryId: "",
  isActive: true,
  allowGiftBoxBundling: false,
  visibleHostnames: "",
  images: [],
};

const product = {
  id: "p1",
  name: "Silk Scarf",
  price: 1000,
  compareAtPrice: null,
  imageUrl: null,
  description: null,
  stockQuantity: 5,
  badge: null,
  category: { name: "Silk" },
  categoryId: 1,
  sku: "SILK-1",
  isActive: true,
  createdAt: "2026-08-01T00:00:00.000Z",
  images: [],
} as unknown as Product;

function buildProps(overrides: Record<string, unknown> = {}) {
  return {
    showForm: false,
    formClosing: false,
    productForm: emptyForm,
    productLoading: false,
    products: [product],
    productsLoading: false,
    loadingProductId: null,
    productPage: 1,
    productTotalPages: 1,
    categories: [],
    categoriesLoading: false,
    filters: { search: "", categoryId: "", badge: "all", status: "all", sort: "newest" },
    onFilterChange: vi.fn(),
    onFilterReset: vi.fn(),
    onToggleForm: vi.fn(),
    onFormChange: vi.fn(),
    onSave: vi.fn(),
    onEdit: vi.fn(),
    onRequestDelete: vi.fn(),
    onPageChange: vi.fn(),
    ...overrides,
  };
}

describe("AdminCataloguePanel header sorting", () => {
  beforeEach(() => vi.clearAllMocks());

  it("clicking the Price header reports price-asc then price-desc", () => {
    const onFilterChange = vi.fn();
    const { rerender } = render(<AdminCataloguePanel {...buildProps({ onFilterChange })} />);

    fireEvent.click(screen.getByRole("button", { name: /sort by price/i }));
    expect(onFilterChange).toHaveBeenCalledWith({ sort: "price-asc" });

    // Parent state flips filters.sort to "price-asc"; re-render with it.
    rerender(
      <AdminCataloguePanel
        {...buildProps({
          onFilterChange,
          filters: { search: "", categoryId: "", badge: "all", status: "all", sort: "price-asc" },
        })}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /sort by price/i }));
    expect(onFilterChange).toHaveBeenLastCalledWith({ sort: "price-desc" });
  });

  it("renders rows via column cells and keeps pagination bar", () => {
    render(<AdminCataloguePanel {...buildProps()} />);
    expect(screen.getByText("Silk Scarf")).toBeInTheDocument();
    expect(screen.getByText(/page 1 of 1/i)).not.toBeInTheDocument(); // PaginationBar hides at 1 page
  });
});
```

If the panel's rendered text differs slightly (e.g., the summary count), adjust only assertions that reference copy — the header-click assertions are the contract.

- [ ] **Step 3: Implement the sort adapter + columns**

Create `src/components/admin/table/columns.catalogue.tsx`. Structure (port every cell's JSX **verbatim** from the current `ProductRow` in `AdminCataloguePanel.tsx:298–411` — same classNames, same conditional logic, same emoji labels):

```tsx
"use client";

import { useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import FallbackImage from "@/src/components/ui/FallbackImage";
import type { Product } from "@/src/lib/api/schemas";

export interface CatalogueTableMeta {
  loadingProductId: string | null;
  onPreviewImages: (product: Product) => void;
  onEdit: (product: Product) => void;
  onRequestDelete: (product: Product) => void;
}

const COLUMN_API_SORTS = {
  name: { asc: "name-asc", desc: "name-desc" },
  price: { asc: "price-asc", desc: "price-desc" },
  stockQuantity: { asc: "stock-asc", desc: "stock-desc" },
  sku: { asc: "sku-asc", desc: "sku-desc" },
  createdAt: { asc: "oldest", desc: "newest" },
} as const;

export function apiSortToSorting(apiSort: string): SortingState {
  for (const [id, pair] of Object.entries(COLUMN_API_SORTS)) {
    if (pair.asc === apiSort) return [{ id, desc: false }];
    if (pair.desc === apiSort) return [{ id, desc: true }];
  }
  return [];
}

export function sortingToApiSort(sorting: SortingState): string {
  const head = sorting[0];
  if (!head) return "newest";
  const pair = COLUMN_API_SORTS[head.id as keyof typeof COLUMN_API_SORTS];
  return pair ? (head.desc ? pair.desc : pair.asc) : "newest";
}
```

Then the columns factory. Each rich cell is a small component in this file carrying over the exact markup from `ProductRow`:

```tsx
function GalleryThumbCell({ product, onPreview }: { product: Product; onPreview: (p: Product) => void }) {
  const [imgFailed, setImgFailed] = useState(false);
  const primaryImage = product.images?.find((img) => img.isPrimary)?.url || product.imageUrl;
  const hasValidImage = primaryImage && !imgFailed && /^https?:\/\//.test(primaryImage);
  return (
    <div className="table-img-wrapper" onClick={() => onPreview(product)} title="Click to view full image gallery">
      {hasValidImage ? (
        <FallbackImage
          src={primaryImage}
          alt={product.name}
          width={52}
          height={52}
          className="product-table-img"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div className="product-img-placeholder" />
      )}
      <div className="table-img-zoom-hint" aria-hidden="true">🔍</div>
    </div>
  );
}
```

⚠️ Before finalizing, read `FallbackImage`'s props (`src/components/ui/FallbackImage.tsx`) and copy the exact props the current `ProductRow` passes (including its error callback name) — the cell must be a mechanical move of the existing JSX, not a re-imagination. Same instruction for every cell below: the source of truth is `AdminCataloguePanel.tsx:298–411`.

```tsx
export function createCatalogueColumns(meta: CatalogueTableMeta): ColumnDef<Product>[] {
  const { loadingProductId, onPreviewImages, onEdit, onRequestDelete } = meta;
  const inr = (n: number) => n.toLocaleString("en-IN", { minimumFractionDigits: 2 });
  return [
    {
      id: "image",
      header: "Image",
      enableSorting: false,
      cell: ({ row }) => <GalleryThumbCell product={row.original} onPreview={onPreviewImages} />,
    },
    {
      id: "name",
      accessorKey: "name",
      header: "Name",
      meta: { label: "Name" },
      cell: ({ row }) => <span className="fw-500">{row.original.name}</span>,
    },
    {
      id: "category",
      header: "Category",
      enableSorting: false,
      cell: ({ row }) =>
        row.original.category?.name ? (
          <span className="category-pill-badge">{row.original.category.name}</span>
        ) : (
          <span className="text-muted text-xs">—</span>
        ),
    },
    {
      id: "sku",
      accessorFn: (p) => p.sku ?? "",
      header: "Code",
      meta: { label: "Code" },
      cell: ({ row }) =>
        row.original.sku ? (
          <code className="sku-code">{row.original.sku}</code>
        ) : (
          <span className="text-xs text-muted">—</span>
        ),
    },
    {
      id: "price",
      accessorFn: (p) => Number(p.price) || 0,
      header: "Price & MRP",
      meta: { label: "Price" },
      cell: ({ row }) => {
        const priceNum = Number(row.original.price) || 0;
        const compareNum = Number(row.original.compareAtPrice) || 0;
        const hasDiscount = compareNum > priceNum;
        const savingsPercent = hasDiscount
          ? Math.round(((compareNum - priceNum) / compareNum) * 100)
          : 0;
        return (
          <div className="table-price-cell">
            <div className="price-primary">₹{inr(priceNum)}</div>
            {hasDiscount && (
              <div className="price-secondary">
                <span className="price-mrp">₹{inr(compareNum)}</span>
                <span className="discount-badge">-{savingsPercent}%</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: "stockQuantity",
      accessorKey: "stockQuantity",
      header: "Stock",
      meta: { label: "Stock" },
      cell: ({ row }) => {
        const qty = row.original.stockQuantity;
        return (
          <span
            className={`stock-health-badge ${qty <= 0 ? "out-of-stock" : qty <= 3 ? "low-stock" : "in-stock"}`}
          >
            <span className="stock-dot" />
            {qty <= 0 ? "Out of stock" : qty <= 3 ? `Low (${qty})` : `${qty} in stock`}
          </span>
        );
      },
    },
    {
      id: "badge",
      header: "Badge",
      enableSorting: false,
      cell: ({ row }) =>
        row.original.badge ? (
          <span className={`luxury-badge badge-${row.original.badge.toLowerCase()}`}>
            {row.original.badge}
          </span>
        ) : (
          <span className="text-xs text-muted">—</span>
        ),
    },
    {
      id: "bundling",
      header: "Bundling",
      enableSorting: false,
      cell: ({ row }) =>
        row.original.allowGiftBoxBundling ? (
          <span className="table-status-pill active">
            <span className="status-dot" />
            Enabled
          </span>
        ) : (
          <span className="text-xs text-muted">—</span>
        ),
    },
    {
      id: "gallery",
      header: "Gallery",
      enableSorting: false,
      cell: ({ row }) => {
        const product = row.original;
        const imageCount = product.images?.length || (product.imageUrl ? 1 : 0);
        return (
          <button
            className="image-count-pill"
            onClick={() => onPreviewImages(product)}
            title="Click to preview gallery images"
          >
            🖼️ {imageCount}
          </button>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => (
        <span className={`table-status-pill ${row.original.isActive ? "active" : ""}`}>
          <span className="status-dot" />
          {row.original.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      id: "createdAt",
      accessorFn: (p) => new Date(p.createdAt).getTime(),
      header: "Created",
      meta: { label: "Created" },
      cell: ({ row }) => (
        <time dateTime={String(row.original.createdAt)}>
          {new Date(row.original.createdAt).toLocaleDateString("en-IN")}
        </time>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => {
        const product = row.original;
        const isDeleting = loadingProductId === product.id;
        return (
          <div className="table-actions">
            <button
              className="btn btn-secondary product-action-btn btn-xs"
              onClick={() => onEdit(product)}
              disabled={isDeleting}
              title="Edit product"
            >
              ✏️ Edit
            </button>
            <button
              className={`btn btn-danger product-action-btn btn-xs ${isDeleting ? "loading" : ""}`}
              onClick={() => onRequestDelete(product)}
              disabled={isDeleting}
              title="Delete product"
            >
              {isDeleting ? "..." : "🗑️ Delete"}
            </button>
          </div>
        );
      },
    },
  ];
}
```

⚠️ Every cell above was ported from `ProductRow` (`AdminCataloguePanel.tsx:298–411`). Before finalizing, diff each cell against the original and restore any detail the port dropped (exact classNames, conditional wrappers like the Status cell's `td.active-cell` class placement, FallbackImage prop names from `src/components/ui/FallbackImage.tsx`). The source of truth is the current markup, not this listing.

The full column list is 12 (the original 11 plus the sortable Created column before Actions). Update the empty-state `colSpan` accordingly — `AdminDataTable` already computes it from `visibleColumns.length`, so no manual number remains in the panel.

- [ ] **Step 4: Integrate into the panel**

In `src/components/admin/AdminCataloguePanel.tsx`:

- Delete `SkeletonRows`, `ProductRow`, and the hand-rolled `<table>` block (lines ~218–296 area).
- Keep: `lightboxProduct` state, filters UI, summary bar/chips, `CatalogueProductLightbox`, local `PaginationBar`.
- Build the table:

```tsx
const sorting = useMemo(() => apiSortToSorting(filters.sort), [filters.sort]);

const handleSortingChange: OnChangeFn<SortingState> = useCallback(
  (updater) => {
    const next = typeof updater === "function" ? updater(sorting) : updater;
    onFilterChange({ sort: sortingToApiSort(next) });
  },
  [sorting, onFilterChange],
);

const columns = useMemo(
  () =>
    createCatalogueColumns({
      loadingProductId,
      onPreviewImages: setLightboxProduct,
      onEdit,
      onRequestDelete,
    }),
  [loadingProductId, onEdit, onRequestDelete],
);

const table = useReactTable({
  data: products,
  columns,
  state: { sorting, pagination: { pageIndex: productPage - 1, pageSize: 5 } },
  onSortingChange: handleSortingChange,
  manualSorting: true,
  manualPagination: true,
  pageCount: productTotalPages,
  getCoreRowModel: getCoreRowModel(),
});
```

- Render:

```tsx
<AdminDataTable
  table={table}
  isLoading={productsLoading}
  skeletonRowCount={5}
  emptyMessage="No products match your filters."
/>
<PaginationBar page={productPage} totalPages={productTotalPages} onPageChange={onPageChange} />
{lightboxProduct && (
  <CatalogueProductLightbox product={lightboxProduct} onClose={() => setLightboxProduct(null)} />
)}
```

Because `onFilterChange` merges into filters AND resets the page to 1 (`useAdminPageState.ts:82–90`), header-click sorting automatically stays in sync with the sort `<select>` (both read/write `filters.sort`) and resets pagination — the bidirectional sync the spec requires, with no extra state.

- Keep the `ProductFormData` export intact (`ProductFormModal.tsx:7` imports it).
- Do NOT change any filter-select markup; the sort select keeps its 10 options with the same values.

- [ ] **Step 5: Run tests**

Run: `npx vitest run src/__tests__/components/admin/catalogue-sort-adapter.test.ts src/__tests__/components/admin/AdminCataloguePanel.test.tsx src/__tests__/components/admin/table/AdminDataTable.test.tsx`
Expected: PASS. Then run `npm run typecheck` — the panel refactor must compile clean.

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/table/columns.catalogue.tsx src/components/admin/AdminCataloguePanel.tsx src/__tests__/components/admin/catalogue-sort-adapter.test.ts src/__tests__/components/admin/AdminCataloguePanel.test.tsx
git commit -m "feat(admin): migrate catalogue panel to sortable TanStack table"
```

---

### Task 6: Categories panel — client-mode table with global search

**Files:**
- Create: `src/components/admin/table/columns.categories.tsx`
- Modify: `src/components/admin/AdminCategoriesPanel.tsx` (client-mode table + search input; delete-confirm modal untouched)
- Modify: `app/styles/admin.css` (append search-input spacing rule if needed)
- Test: `src/__tests__/components/admin/AdminCategoriesPanel.test.tsx`

**Interfaces:**
- Consumes: `AdminDataTable` (Task 1), `Category` type from `src/lib/api/schemas`, panel props `onToggleActive(c)`, `onEdit(c)`, `onRequestDelete({ ...c, productCount })`.
- Produces: `createCategoryColumns(meta: CategoryTableMeta): ColumnDef<Category>[]` with `CategoryTableMeta = { togglePendingId: number | null; loadingCategoryId: number | null; onToggleActive: (c: Category) => void; onEdit: (c: Category) => void; onRequestDelete: (c: Category & { productCount: number }) => void }`.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/components/admin/AdminCategoriesPanel.test.tsx`. Render the panel with minimal props stubbed from its current `Props` interface (read lines 11–29 of the file for the exact list — stub everything not under test with `vi.fn()`; supply the delete-confirm closed state `{ open: false, categoryName: "", productCount: 0 }`). Tests:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AdminCategoriesPanel from "@/src/components/admin/AdminCategoriesPanel";
import type { Category } from "@/src/lib/api/schemas";

function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: 1,
    name: "Jewellery",
    slug: "jewellery",
    displayOrder: 1,
    isActive: true,
    productCount: 4,
    ...overrides,
  } as Category;
}

// buildProps(categories, overrides) supplies every prop the panel requires,
// with mutation callbacks as vi.fn()s — see panel Props at
// src/components/admin/AdminCategoriesPanel.tsx:11-29.

describe("AdminCategoriesPanel", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders sortable column headers and rows", () => {
    render(panel with [makeCategory(), makeCategory({ id: 2, name: "Silk", slug: "silk", displayOrder: 2 })]);
    for (const header of [/name/i, /slug/i, /order/i, /products/i, /status/i]) {
      expect(screen.getByRole("columnheader", { name: header })).toBeInTheDocument();
    }
    expect(screen.getByText("Jewellery")).toBeInTheDocument();
    expect(screen.getByText("Silk")).toBeInTheDocument();
  });

  it("search input narrows rows by name and slug", () => {
    render(panel with the two categories above);
    fireEvent.change(screen.getByLabelText("Search categories"), { target: { value: "sil" } });
    expect(screen.queryByText("Jewellery")).not.toBeInTheDocument();
    expect(screen.getByText("Silk")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Search categories"), { target: { value: "jewellery" } });
    expect(screen.getByText("Jewellery")).toBeInTheDocument();
    expect(screen.queryByText("Silk")).not.toBeInTheDocument();
  });

  it("header click sorts rows client-side by display order", () => {
    const silkFirst = [makeCategory({ id: 1, name: "A", displayOrder: 2 }), makeCategory({ id: 2, name: "B", displayOrder: 1 })];
    render(panel with silkFirst);
    fireEvent.click(screen.getByRole("button", { name: /sort by order/i }));
    const rows = screen.getAllByRole("row");
    // tbody rows: index 0 is thead-only; find the two data rows and assert B (displayOrder 1) comes first
    const bodyText = rows.map((r) => r.textContent ?? "");
    expect(bodyText.findIndex((t) => t.includes("B"))).toBeLessThan(bodyText.findIndex((t) => t.includes("A")));
  });

  it("toggle, edit and delete remain callable", () => {
    const onToggleActive = vi.fn();
    const onEdit = vi.fn();
    const onRequestDelete = vi.fn();
    render(panel with [makeCategory()] and those callbacks);
    fireEvent.click(screen.getByRole("button", { name: /disable/i }));
    expect(onToggleActive).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));
    expect(onEdit).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(onRequestDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 1, productCount: 4 }));
  });

  it("delete-guard modal still blocks when productCount > 0", () => {
    render(panel with deleteConfirm open: { open: true, categoryName: "Jewellery", productCount: 4 });
    expect(screen.getByText(/still has 4 active product/i)).toBeInTheDocument();
    const confirmBtn = screen.getByRole("button", { name: /cannot delete/i });
    expect(confirmBtn).toBeDisabled();
  });
});
```

The prose comments above mark where the executor fills the literal props object; the assertions themselves are the contract. Write the real `render(...)` calls with the full prop list — no helper magic.

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/__tests__/components/admin/AdminCategoriesPanel.test.tsx`
Expected: FAIL — no search input labelled "Search categories", no sort buttons.

- [ ] **Step 3: Implement columns**

Create `src/components/admin/table/columns.categories.tsx`:

```tsx
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Category } from "@/src/lib/api/schemas";

export interface CategoryTableMeta {
  togglePendingId: number | null;
  loadingCategoryId: number | null;
  onToggleActive: (c: Category) => void;
  onEdit: (c: Category) => void;
  onRequestDelete: (c: Category & { productCount: number }) => void;
}

export function createCategoryColumns(meta: CategoryTableMeta): ColumnDef<Category>[] {
  return [
    {
      id: "name",
      accessorKey: "name",
      header: "Name",
      meta: { label: "Name" },
      cell: ({ row }) => <span className="fw-500">{row.original.name}</span>,
    },
    {
      id: "slug",
      accessorKey: "slug",
      header: "Slug",
      meta: { label: "Slug" },
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted">{row.original.slug}</span>
      ),
    },
    {
      id: "displayOrder",
      accessorKey: "displayOrder",
      header: "Order",
      meta: { label: "Order" },
    },
    {
      id: "productCount",
      accessorFn: (c) => c.productCount ?? 0,
      header: "Products",
      meta: { label: "Products" },
      cell: ({ row }) => {
        const productCount = row.original.productCount ?? 0;
        return (
          <span className={`stock-badge ${productCount > 0 ? "in-stock" : "empty"}`}>
            {productCount}
          </span>
        );
      },
    },
    {
      id: "isActive",
      accessorFn: (c) => (c.isActive ?? true ? 1 : 0),
      header: "Status",
      meta: { label: "Status" },
      cell: ({ row }) => {
        const isActive = row.original.isActive ?? true;
        return (
          <span className={`status-badge ${isActive ? "delivered" : "rejected"}`}>
            {isActive ? "Active" : "Inactive"}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => {
        const c = row.original;
        const isActive = c.isActive ?? true;
        const productCount = c.productCount ?? 0;
        const isDeleting = meta.loadingCategoryId === c.id;
        const isToggling = meta.togglePendingId === c.id;
        return (
          <div className="table-actions">
            <button
              className="btn btn-secondary product-action-btn btn-xs"
              disabled={isToggling}
              onClick={() => meta.onToggleActive(c)}
            >
              {isActive ? "Disable" : "Enable"}
            </button>
            <button
              className="btn btn-secondary product-action-btn btn-xs"
              disabled={isDeleting}
              onClick={() => meta.onEdit(c)}
            >
              ✏️ Edit
            </button>
            <button
              className={`btn btn-danger product-action-btn btn-xs ${isDeleting ? "loading" : ""}`}
              disabled={isDeleting}
              onClick={() => meta.onRequestDelete({ ...c, productCount })}
            >
              {isDeleting ? <span className="btn-spinner" /> : "🗑️ Delete"}
            </button>
          </div>
        );
      },
    },
  ];
}
```

Preserve the exact action-button labels/classes from the current panel (`AdminCategoriesPanel.tsx:116–141`) — adjust emoji/disabled details to match verbatim.

- [ ] **Step 4: Integrate into the panel**

In `AdminCategoriesPanel.tsx`, replace the hand-rolled table (lines 70–148) with client-mode TanStack:

```tsx
const [sorting, setSorting] = useState<SortingState>([]);
const [globalFilter, setGlobalFilter] = useState("");

const columns = useMemo(
  () =>
    createCategoryColumns({
      togglePendingId,
      loadingCategoryId,
      onToggleActive,
      onEdit,
      onRequestDelete,
    }),
  [togglePendingId, loadingCategoryId, onToggleActive, onEdit, onRequestDelete],
);

const table = useReactTable({
  data: categories,
  columns,
  state: { sorting, globalFilter },
  onSortingChange: setSorting,
  onGlobalFilterChange: setGlobalFilter,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  globalFilterFn: (row, _columnId, filterValue) => {
    const q = String(filterValue).toLowerCase();
    return (
      row.original.name.toLowerCase().includes(q) ||
      row.original.slug.toLowerCase().includes(q)
    );
  },
});
```

Add the search input between the Add button and the table:

```tsx
<div className="admin-category-search">
  <input
    type="text"
    className="admin-catalogue-search-input"
    placeholder="Search by name or slug..."
    value={globalFilter}
    onChange={(e) => setGlobalFilter(e.target.value)}
    aria-label="Search categories"
  />
</div>
```

Render `<AdminDataTable table={table} isLoading={categoriesLoading} skeletonRowCount={4} emptyMessage="No categories found." />` followed by the unchanged delete-confirm modal. Keep `BADGE_ACTIVE`/`BADGE_INACTIVE` semantics via the literal `"delivered"`/`"rejected"` classes shown in Step 3 (they intentionally reuse order-status badge styling, matching the current implementation at lines 8–9).

Append to `app/styles/admin.css`:

```css
/* ── Category Search ── */
.admin-category-search {
    margin-bottom: 16px;
}
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run src/__tests__/components/admin/AdminCategoriesPanel.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/table/columns.categories.tsx src/components/admin/AdminCategoriesPanel.tsx app/styles/admin.css src/__tests__/components/admin/AdminCategoriesPanel.test.tsx
git commit -m "feat(admin): migrate categories panel to client-mode TanStack table with search"
```

---

### Task 7: Full verification gate

**Files:** none (verification only)

- [ ] **Step 1: Typecheck**

Run: `npm run typecheck`
Expected: clean exit, no errors.

- [ ] **Step 2: Full test suite**

Run: `npm run test:run`
Expected: all files pass, including pre-existing suites (`query-keys.test.ts`, `openapi-spec.test.ts`, `OrderDetailModal.test.tsx`, all `api/*` tests).

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: 0 errors (pre-existing warnings acceptable).

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: successful production build; static/dynamic boundary check passes.

- [ ] **Step 5: Fix anything the gate surfaces, then commit residuals**

If any fix was needed:

```bash
git add -A
git commit -m "fix(admin): address verification-gate findings"
```
