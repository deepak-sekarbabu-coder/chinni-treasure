"use client";

import { useMemo, useState } from "react";
import { Eye, EyeSlash, PencilSimple, Trash, X } from "@phosphor-icons/react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type SortingState,
} from "@tanstack/react-table";
import AdminDataTable from "@/src/components/admin/table/AdminDataTable";
import { AdminCardList } from "@/src/components/admin/table/AdminList";
import { createCategoryColumns } from "@/src/components/admin/table/columns.categories";
import { useFocusTrap } from "@/src/lib/useFocusTrap";
import CategoryFormModal from "@/src/components/admin/CategoryFormModal";
import type { CategoriesPanelViewModel } from "@/src/components/admin/useAdminCategoriesPanel";

/** Takes the panel view-model whole — see AdminCataloguePanel for why. */
export default function AdminCategoriesPanel({ panel }: { panel: CategoriesPanelViewModel }) {
  const {
    showForm,
    formClosing,
    form,
    categories,
    deleteConfirm,
    loadingCategoryId,
    togglePendingId,
  } = panel.data;
  const { loading: categoriesLoading, formSaving: productLoading } = panel;
  const {
    onToggleForm,
    onFormChange,
    onSave,
    onEdit,
    onRequestDelete,
    onCancelDelete,
    onConfirmDelete,
    onToggleActive,
  } = panel.actions;
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

  // The search box filters through the table, so the cards read the table's
  // filtered rows rather than the raw list.
  const visibleCategories = table.getFilteredRowModel().rows.map((row) => row.original);

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

      <div className="admin-catalogue-search">
        <input
          type="text"
          className="admin-catalogue-search-input"
          placeholder="Search by name or slug..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          aria-label="Search categories"
        />
        {globalFilter && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={() => setGlobalFilter("")}
            aria-label="Clear search"
          >
            <X size={14} weight="bold" aria-hidden="true" />
          </button>
        )}
      </div>

      <AdminDataTable
        table={table}
        isLoading={categoriesLoading}
        skeletonRowCount={4}
        emptyMessage="No categories found."
      />

      <AdminCardList
        as="ul"
        className="admin-category-cards"
        loading={categoriesLoading}
        isEmpty={visibleCategories.length === 0}
        empty={<p className="empty-state">No categories found.</p>}
        skeletonCount={3}
        renderSkeleton={categoryCardSkeleton}
      >
        {visibleCategories.map((c) => {
          const isActive = c.isActive ?? true;
          const productCount = c.productCount ?? 0;
          const isToggling = togglePendingId === c.id;
          const isDeleting = loadingCategoryId === c.id;
          const ToggleIcon = isActive ? EyeSlash : Eye;
          return (
            <li key={c.id} className="category-card">
              <div className="category-card-head">
                <div className="category-card-title">
                  <strong className="category-card-name">{c.name}</strong>
                  <span className="font-mono text-xs text-muted">{c.slug}</span>
                </div>
                <span className={`status-badge ${isActive ? "delivered" : "rejected"}`}>
                  {isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="category-card-meta">
                <span className="category-card-order">
                  Order <strong className="table-numeric">{c.displayOrder}</strong>
                </span>
                <span className={`stock-badge table-numeric ${productCount > 0 ? "in-stock" : "empty"}`}>
                  {productCount} product{productCount === 1 ? "" : "s"}
                </span>
              </div>
              <div className="category-card-actions">
                <button
                  type="button"
                  className="btn btn-secondary product-action-btn btn-sm"
                  disabled={isToggling || isDeleting}
                  onClick={() => onToggleActive(c)}
                >
                  {isToggling ? (
                    <span className="btn-spinner" aria-hidden="true" />
                  ) : (
                    <ToggleIcon size={15} weight="bold" aria-hidden="true" />
                  )}
                  {isActive ? "Disable" : "Enable"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary product-action-btn btn-sm"
                  disabled={isToggling || isDeleting}
                  onClick={() => onEdit(c)}
                >
                  <PencilSimple size={15} weight="bold" aria-hidden="true" />
                  Edit
                </button>
                <button
                  type="button"
                  className={`btn btn-danger product-action-btn btn-sm ${isDeleting ? "loading" : ""}`}
                  disabled={isToggling || isDeleting}
                  onClick={() => onRequestDelete({ ...c, productCount })}
                >
                  {isDeleting ? (
                    <span className="btn-spinner" aria-hidden="true" />
                  ) : (
                    <Trash size={15} weight="bold" aria-hidden="true" />
                  )}
                  Delete
                </button>
              </div>
            </li>
          );
        })}
      </AdminCardList>

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
              <button className="modal-close" onClick={onCancelDelete}>
                <X size={16} weight="bold" aria-hidden="true" />
              </button>
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

/** The mobile card placeholder, drawn by the shared AdminCardList frame. */
function categoryCardSkeleton() {
  return (
    <li className="category-card" aria-hidden="true">
      <div className="skeleton-text" style={{ width: "45%", height: 14 }} />
      <div className="skeleton-text" style={{ width: "30%", height: 12, marginTop: 8 }} />
      <div className="skeleton-text" style={{ width: "25%", height: 12, marginTop: 14 }} />
    </li>
  );
}


