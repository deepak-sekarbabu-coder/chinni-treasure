"use client";

import type { ColumnDef, SortingState } from "@tanstack/react-table";
import StatusBadge from "@/src/components/ui/StatusBadge";
import type { Order } from "@/src/lib/api/schemas";

export interface OrdersTableMeta {
  onSelectOrder: (order: Order) => void;
}

export type OrderSortKey = "date-desc" | "date-asc" | "total-desc" | "total-asc";

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
      sortDescFirst: false,
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
      sortDescFirst: false,
      cell: ({ row }) => (
        <time dateTime={row.original.createdAt}>
          {new Date(row.original.createdAt).toLocaleDateString("en-IN")}
        </time>
      ),
    },
  ];
}
