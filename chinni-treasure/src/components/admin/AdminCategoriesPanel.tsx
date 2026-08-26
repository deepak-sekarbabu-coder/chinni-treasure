"use client";

import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type SortingState,
} from "@tanstack/react-table";
import AdminDataTable from "@/src/components/admin/table/AdminDataTable";
import { createCategoryColumns } from "@/src/components/admin/table/columns.categories";
import { useFocusTrap } from "@/src/lib/useFocusTrap";
import type { Category } from "@/src/lib/api/schemas";
import type { CategoryFormState } from "@/src/lib/hooks/useAdminCategoriesController";
import CategoryFormModal from "@/src/components/admin/CategoryFormModal";

interface Props {
  showForm: boolean;
  formClosing: boolean;
  form: CategoryFormState;
  productLoading: boolean;
  categories: Category[];
  categoriesLoading: boolean;
  deleteConfirm: { open: boolean; categoryName: string; productCount: number };
  loadingCategoryId: number | null;
  togglePendingId: number | null;
  onToggleForm: () => void;
  onFormChange: (form: CategoryFormState) => void;
  onSave: (e: React.FormEvent) => Promise<void>;
  onEdit: (category: Category) => void;
  onRequestDelete: (category: Category & { productCount: number }) => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => Promise<void>;
  onToggleActive: (category: Category) => void;
}

export default function AdminCategoriesPanel({
  showForm,
  formClosing,
  form,
  productLoading,
  categories,
  categoriesLoading,
  deleteConfirm,
  loadingCategoryId,
  togglePendingId,
  onToggleForm,
  onFormChange,
  onSave,
  onEdit,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
  onToggleActive,
}: Props) {
  const deleteTrapRef = useFocusTrap(deleteConfirm.open);
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
    sortDescFirst: false,
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue).toLowerCase();
      return (
        row.original.name.toLowerCase().includes(q) ||
        row.original.slug.toLowerCase().includes(q)
      );
    },
  });

  return (
    <div id="panel-categories" role="tabpanel" aria-labelledby="tab-categories">
      <div className="product-form-actions">
        <button className="btn btn-primary product-add-btn" onClick={onToggleForm}>
          + Add Category
        </button>
      </div>

      <CategoryFormModal
        open={showForm}
        formClosing={formClosing}
        form={form}
        productLoading={productLoading}
        onFormChange={onFormChange}
        onSave={onSave}
        onClose={onToggleForm}
      />

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

      <AdminDataTable
        table={table}
        isLoading={categoriesLoading}
        skeletonRowCount={4}
        emptyMessage="No categories found."
      />

      {deleteConfirm.open && (
        <div
          className="modal-overlay active"
          ref={deleteTrapRef}
          onClick={onCancelDelete}
          onKeyDown={(e) => { if (e.key === "Escape") onCancelDelete(); }}
        >
          <div
            className="modal-content modal-content-md"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-cat-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 id="delete-cat-title">Confirm Delete</h2>
              <button className="modal-close" onClick={onCancelDelete}>✕</button>
            </div>
            <div className="modal-body">
              {deleteConfirm.productCount > 0 ? (
                <p className="delete-warning mb-10">
                  This category still has {deleteConfirm.productCount} active product(s).
                  Reassign or delete them first before removing the category.
                </p>
              ) : (
                <p className="delete-warning mb-10">
                  This action will permanently remove the category.
                </p>
              )}
              <div className="delete-box">
                <p className="delete-label">Category</p>
                <p className="delete-name">{deleteConfirm.categoryName}</p>
              </div>
              <div className="modal-actions">
                <button
                  className="btn btn-danger"
                  onClick={onConfirmDelete}
                  disabled={deleteConfirm.productCount > 0}
                >
                  {deleteConfirm.productCount > 0 ? "Cannot Delete" : "Yes, Delete Category"}
                </button>
                <button className="btn btn-secondary" onClick={onCancelDelete} autoFocus>
                  Keep Category
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
