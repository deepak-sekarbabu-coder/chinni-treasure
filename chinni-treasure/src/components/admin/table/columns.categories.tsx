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
      sortDescFirst: false,
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
              Edit
            </button>
            <button
              className={`btn btn-danger product-action-btn btn-xs ${isDeleting ? "loading" : ""}`}
              disabled={isDeleting}
              onClick={() => meta.onRequestDelete({ ...c, productCount })}
            >
              {isDeleting && <span className="btn-spinner" />}
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        );
      },
    },
  ];
}
