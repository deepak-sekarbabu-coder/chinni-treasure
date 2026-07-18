"use client";

import { useFocusTrap } from "@/src/lib/useFocusTrap";
import { slugify } from "@/src/lib/utils";
import type { CategoryFormState } from "@/src/lib/hooks/useAdminCategoriesController";

interface Props {
  open: boolean;
  formClosing: boolean;
  form: CategoryFormState;
  productLoading: boolean;
  onFormChange: (form: CategoryFormState) => void;
  onSave: (e: React.FormEvent) => Promise<void>;
  onClose: () => void;
}

export default function CategoryFormModal({
  open,
  formClosing,
  form,
  productLoading,
  onFormChange,
  onSave,
  onClose,
}: Props) {
  const trapRef = useFocusTrap(open);
  const isEdit = form.id !== null;

  return (
    <div
      className={`modal-overlay ${open ? "active" : ""} ${formClosing ? "closing" : ""}`}
      ref={trapRef}
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
      aria-hidden={!open}
    >
      <div
        className="modal-content category-form-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-form-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="category-form-modal-title" className="font-serif">
            {isEdit ? "Edit Category" : "Add New Category"}
          </h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={onSave} className="category-form-modal-form">
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
            <div className="product-form-footer">
              <button type="button" className="btn btn-secondary product-add-btn cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className={`btn btn-primary product-add-btn ${productLoading ? "loading" : ""}`} disabled={productLoading}>
                {productLoading && <span className="btn-spinner"></span>}
                {productLoading ? (isEdit ? "Saving..." : "Adding...") : (isEdit ? "Save Changes" : "Create Category")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
