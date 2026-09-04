"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Eye, EyeSlash, PencilSimple, Trash } from "@phosphor-icons/react";
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
      meta: { label: "Order", align: "right" },
      sortDescFirst: false,
      cell: ({ row }) => <span className="table-numeric">{row.original.displayOrder}</span>,
    },
    {
      id: "productCount",
      accessorFn: (c) => c.productCount ?? 0,
      header: "Products",
      meta: { label: "Products", align: "right" },
      cell: ({ row }) => {
        const productCount = row.original.productCount ?? 0;
        return (
          <span className={`stock-badge table-numeric ${productCount > 0 ? "in-stock" : "empty"}`}>
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
        const ToggleIcon = isActive ? EyeSlash : Eye;
        return (
          <div className="table-actions">
            <button
              type="button"
              className={`btn btn-secondary product-action-btn icon-btn ${isToggling ? "loading" : ""}`}
              disabled={isToggling || isDeleting}
              onClick={() => meta.onToggleActive(c)}
              title={isActive ? "Disable category" : "Enable category"}
              aria-label={`${isActive ? "Disable" : "Enable"} ${c.name}`}
            >
              {isToggling ? (
                <span className="btn-spinner" aria-hidden="true" />
              ) : (
                <ToggleIcon size={15} weight="bold" aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              className="btn btn-secondary product-action-btn icon-btn"
              disabled={isToggling || isDeleting}
              onClick={() => meta.onEdit(c)}
              title="Edit category"
              aria-label={`Edit ${c.name}`}
            >
              <PencilSimple size={15} weight="bold" aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`btn btn-danger product-action-btn icon-btn ${isDeleting ? "loading" : ""}`}
              disabled={isToggling || isDeleting}
              onClick={() => meta.onRequestDelete({ ...c, productCount })}
              title="Delete category"
              aria-label={`Delete ${c.name}`}
            >
              {isDeleting ? (
                <span className="btn-spinner" aria-hidden="true" />
              ) : (
                <Trash size={15} weight="bold" aria-hidden="true" />
              )}
            </button>
          </div>
        );
      },
    },
  ];
}