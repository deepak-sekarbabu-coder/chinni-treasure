"use client";

import { useCallback, useMemo } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
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
      const base = STATE_TO_ORDER_SORT[head.id];
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
            style: { cursor: isAdvancing ? ("default" as const) : ("pointer" as const) },
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
            <CaretLeft size={14} weight="bold" aria-hidden="true" />
            Prev
          </button>
          <span className="pagination-text">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            disabled={currentPage >= totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Next
            <CaretRight size={14} weight="bold" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
