"use client";

import { useCallback, useMemo } from "react";
import { type SortingState, type OnChangeFn } from "@tanstack/react-table";
import AdminDataTable from "@/src/components/admin/table/AdminDataTable";
import { AdminCardList, AdminPaginationBar, useAdminListTable } from "@/src/components/admin/table/AdminList";
import { fromSortingState, toSortingState } from "@/src/components/admin/table/sort-adapter";
import StatusBadge from "@/src/components/ui/StatusBadge";
import FallbackImage from "@/src/components/ui/FallbackImage";
import {
  createOrderColumns,
  ORDER_COLUMN_SORTS,
} from "@/src/components/admin/table/columns.orders";
import { ORDER_STATUS_FILTERS } from "@/src/lib/constants";
import { formatMoney } from "@/src/lib/format";
import { isDisplayableImageUrl } from "@/src/lib/product-display";
import type { Order } from "@/src/lib/api/schemas";
import type { OrdersPanelViewModel } from "@/src/components/admin/useAdminOrdersPanel";

function OrderCard({
  order,
  isAdvancing,
  isSelected,
  onSelect,
}: {
  order: Order;
  isAdvancing: boolean;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const imageUrl = order.items?.[0]?.product?.imageUrl;
  const hasValidImage = isDisplayableImageUrl(imageUrl);

  return (
    <div
      className={`order-card${isAdvancing ? " order-card-advancing" : ""}${isSelected ? " order-card-selected" : ""}`}
      onClick={() => !isAdvancing && onSelect()}
      style={{ cursor: isAdvancing ? "default" : "pointer" }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (!isAdvancing) onSelect();
        }
      }}
    >
      <div className="order-card-main">
        <div className="order-card-thumb">
          {hasValidImage ? (
            <FallbackImage
              src={imageUrl}
              alt=""
              width={56}
              height={56}
              className="order-card-thumb-img"
            />
          ) : (
            <span className="order-card-thumb-placeholder">📦</span>
          )}
          {(order.items?.length ?? 0) > 1 && (
            <span className="order-card-thumb-count">
              {order.items?.length}
            </span>
          )}
        </div>
        <div className="order-card-body">
          <div className="order-card-header">
            <div>
              <div className="order-card-label">Order</div>
              <div className="order-card-number">{order.orderNumber}</div>
            </div>
            <div className="order-card-price">
              {formatMoney(Number(order.totalAmount))}
            </div>
          </div>
          <div className="order-card-footer">
            <div>
              <div className="order-card-label">Customer</div>
              <div className="order-card-name">{order.customerName}</div>
            </div>
            <StatusBadge status={order.status} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrdersPanel({ panel }: { panel: OrdersPanelViewModel }) {
  const {
    orders,
    statusFilter,
    currentPage,
    totalPages,
    advancingOrderId,
    selectedOrder,
    sort,
  } = panel.data;
  const { loading } = panel;
  const {
    onStatusFilterChange,
    onPageChange,
    onSortChange,
    onSelectOrder,
  } = panel.actions;
  const sorting = useMemo(() => toSortingState(ORDER_COLUMN_SORTS, sort), [sort]);

  const handleSortingChange: OnChangeFn<SortingState> = useCallback(
    (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      onSortChange(fromSortingState(ORDER_COLUMN_SORTS, next, "date-desc"));
    },
    [sorting, onSortChange],
  );

  const columns = useMemo(() => createOrderColumns({ onSelectOrder }), [onSelectOrder]);

  const table = useAdminListTable({
    data: orders,
    columns,
    sorting,
    onSortingChange: handleSortingChange,
    pageCount: totalPages,
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

      {/* Desktop table */}
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

      {/* Mobile cards */}
      <AdminCardList
        className="admin-order-cards"
        loading={loading}
        isEmpty={orders.length === 0}
        empty={<div className="empty-state">No orders found.</div>}
        skeletonCount={4}
        renderSkeleton={(index) => (
          <div
            className="order-card order-card-skeleton"
            style={{ animationDelay: `${index * 0.06}s` }}
          >
            <div className="order-card-main">
              <div className="order-card-thumb">
                <div className="skeleton-block" style={{ width: "100%", height: "100%" }} />
              </div>
              <div className="order-card-body" style={{ flex: 1 }}>
                <div className="skeleton-text" style={{ width: "120px", height: "14px", marginBottom: "8px" }} />
                <div className="skeleton-text" style={{ width: "80px", height: "12px" }} />
              </div>
            </div>
          </div>
        )}
      >
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            isAdvancing={advancingOrderId === order.id}
            isSelected={selectedOrder?.id === order.id}
            onSelect={() => onSelectOrder(order)}
          />
        ))}
      </AdminCardList>

      <AdminPaginationBar
        page={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}

