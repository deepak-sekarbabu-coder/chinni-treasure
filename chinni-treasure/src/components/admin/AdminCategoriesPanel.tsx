"use client";

import { useFocusTrap } from "@/src/lib/useFocusTrap";
import { slugify } from "@/src/lib/utils";
import type { Category } from "@/src/lib/api/schemas";
import type { CategoryFormState } from "@/src/lib/hooks/useAdminCategoriesController";

const BADGE_ACTIVE = "delivered";
const BADGE_INACTIVE = "rejected";

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

  return (
    <div id="panel-categories" role="tabpanel" aria-labelledby="tab-categories">
      {!showForm && (
        <div className="product-form-actions">
          <button className="btn btn-primary product-add-btn" onClick={onToggleForm}>
            + Add Category
          </button>
        </div>
      )}

      <div className={`product-form-wrapper ${showForm ? "open" : ""} ${formClosing ? "closing" : ""}`}>
        <div className="product-form-inner">
          <div className="admin-stat-card text-left">
            <h2 className="font-serif mb-20">
              {form.id !== null ? "Edit Category" : "Add New Category"}
            </h2>
            <form onSubmit={onSave}>
              <div className="admin-product-form-grid">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => onFormChange({ ...form, name: e.target.value })}
                    required
                    className="input-cream"
                  />
                </div>
                <div className="form-group">
                  <label>Slug (auto if empty)</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => onFormChange({ ...form, slug: slugify(e.target.value) })}
                    placeholder="e.g. bangles"
                    className="input-cream"
                  />
                </div>
                <div className="form-group">
                  <label>Display Order</label>
                  <input
                    type="number"
                    min="0"
                    value={form.displayOrder}
                    onChange={(e) => onFormChange({ ...form, displayOrder: e.target.value })}
                    className="input-cream"
                  />
                </div>
                <div className="form-group toggle-form-group">
                  <label>Active</label>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => onFormChange({ ...form, isActive: e.target.checked })}
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-label">{form.isActive ? "Active" : "Inactive"}</span>
                  </label>
                </div>
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => onFormChange({ ...form, description: e.target.value })}
                    className="input-cream"
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary" disabled={productLoading}>
                  {productLoading ? "Saving..." : form.id !== null ? "Update Category" : "Create Category"}
                </button>
                <button type="button" className="btn btn-secondary" onClick={onToggleForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="admin-product-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Order</th>
              <th>Products</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categoriesLoading ? (
              <tr>
                <td colSpan={6} className="text-center text-muted" style={{ padding: "24px" }}>
                  Loading categories…
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-muted" style={{ padding: "24px" }}>
                  No categories yet. Create your first one above.
                </td>
              </tr>
            ) : (
              categories.map((c) => {
                const isDeleting = loadingCategoryId === c.id;
                const isToggling = togglePendingId === c.id;
                const isActive = c.isActive ?? true;
                const productCount = c.productCount ?? 0;
                return (
                  <tr key={c.id} className={`product-table-row ${isDeleting ? "removing" : ""}`}>
                    <td className="fw-500">{c.name}</td>
                    <td className="font-mono text-xs text-muted">{c.slug}</td>
                    <td>{c.displayOrder}</td>
                    <td>
                      <span className={`stock-badge ${productCount > 0 ? "in-stock" : "empty"}`}>
                        {productCount}
                      </span>
                    </td>
                    <td className="active-cell">
                      <span className={`status-badge ${isActive ? BADGE_ACTIVE : BADGE_INACTIVE}`}>
                        {isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn btn-secondary product-action-btn btn-xs"
                          onClick={() => onToggleActive(c)}
                          disabled={isToggling}
                        >
                          {isActive ? "Disable" : "Enable"}
                        </button>
                        <button
                          className="btn btn-secondary product-action-btn btn-xs"
                          onClick={() => onEdit(c)}
                          disabled={isDeleting}
                        >
                          Edit
                        </button>
                        <button
                          className={`btn btn-danger product-action-btn btn-xs ${isDeleting ? "loading" : ""}`}
                          onClick={() => onRequestDelete({ ...c, productCount })}
                          disabled={isDeleting}
                        >
                          {isDeleting && <span className="btn-spinner"></span>}
                          {isDeleting ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

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
