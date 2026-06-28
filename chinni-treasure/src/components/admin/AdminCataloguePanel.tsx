"use client";

import Image from "next/image";
import { useState } from "react";
import type { Product } from "@/src/lib/api/schemas";

export interface ProductFormData {
  id: string;
  name: string;
  sku: string;
  description: string;
  price: string;
  stockQuantity: string;
  imageUrl: string;
  badge: string;
  categoryId: string;
  images: Array<{ url: string; isPrimary: boolean; displayOrder: number }>;
}

const BADGE_OPTIONS = [
  { value: "", label: "None" },
  { value: "bestseller", label: "Bestseller" },
  { value: "new", label: "New" },
  { value: "premium", label: "Premium" },
  { value: "limited", label: "Limited" },
  { value: "luxury", label: "Luxury" },
];

interface Props {
  showForm: boolean;
  formClosing: boolean;
  productForm: ProductFormData;
  productLoading: boolean;
  products: Product[];
  productsLoading: boolean;
  loadingProductId: string | null;
  productPage: number;
  productTotalPages: number;
  onToggleForm: () => void;
  onFormChange: (form: ProductFormData) => void;
  onSave: (e: React.FormEvent) => Promise<void>;
  onEdit: (product: Product) => void;
  onRequestDelete: (product: Product) => void;
  onPageChange: (page: number) => void;
}

export default function AdminCataloguePanel({
  showForm,
  formClosing,
  productForm,
  productLoading,
  products,
  productsLoading,
  loadingProductId,
  productPage,
  productTotalPages,
  onToggleForm,
  onFormChange,
  onSave,
  onEdit,
  onRequestDelete,
  onPageChange,
}: Props) {
  function setFormField(field: keyof ProductFormData, value: string) {
    onFormChange({ ...productForm, [field]: value });
  }

  return (
    <div id="panel-catalogue" role="tabpanel" aria-labelledby="tab-catalogue">
      {!showForm && (
        <div className="product-form-actions">
          <button className="btn btn-primary product-add-btn" onClick={onToggleForm}>
            + Add Product
          </button>
        </div>
      )}

      <ProductForm showForm={showForm} formClosing={formClosing} productForm={productForm} productLoading={productLoading} setFormField={setFormField} onFormChange={onFormChange} onSave={onSave} onToggleForm={onToggleForm} />

      <div className="admin-product-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>SKU</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Badge</th>
              <th>Images</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {productsLoading ? (
              <SkeletonRows />
            ) : (
              products.map((p) => (
                <ProductRow key={p.id} product={p} loadingProductId={loadingProductId} onEdit={onEdit} onRequestDelete={onRequestDelete} />
              ))
            )}
          </tbody>
        </table>
      </div>

      <PaginationBar page={productPage} totalPages={productTotalPages} onPageChange={onPageChange} />
    </div>
  );
}

function SkeletonRows() {
  return Array.from({ length: 5 }).map((_, idx) => (
    <tr key={`skeleton-${idx}`} className="product-table-skeleton"
      style={{ animationDelay: `${idx * 0.06}s` }}
    >
      <td><div className="skeleton-block" style={{ width: "40px", height: "50px", borderRadius: "4px" }} /></td>
      <td><div className="skeleton-text skeleton-text-name" /></td>
      <td><div className="skeleton-text skeleton-text-sku" /></td>
      <td><div className="skeleton-text skeleton-text-price" /></td>
      <td><div className="skeleton-text skeleton-text-stock" /></td>
      <td><div className="skeleton-text skeleton-text-badge" /></td>
      <td><div className="skeleton-text" style={{ width: "50px" }} /></td>
      <td>
        <div className="table-actions">
          <div className="skeleton-block" style={{ width: "50px", height: "28px", borderRadius: "2px" }} />
          <div className="skeleton-block" style={{ width: "60px", height: "28px", borderRadius: "2px" }} />
        </div>
      </td>
    </tr>
  ));
}

function ProductRow({ product, loadingProductId, onEdit, onRequestDelete }: {
  product: Product;
  loadingProductId: string | null;
  onEdit: (p: Product) => void;
  onRequestDelete: (p: Product) => void;
}) {
  const isDeleting = loadingProductId === product.id;
  const primaryImage = product.images?.find((img) => img.isPrimary)?.url || product.imageUrl;
  return (
    <tr className={`product-table-row ${isDeleting ? "removing" : ""}`}>
      <td>
        {primaryImage ? (
          <Image src={primaryImage} alt={product.name} width={40} height={50} className="product-img" />
        ) : (
          <div className="product-img-placeholder" />
        )}
      </td>
      <td className="fw-500">{product.name}</td>
      <td className="font-mono text-xs text-muted">{product.sku || "—"}</td>
      <td className="text-gold-dark fw-600">₹{Number(product.price).toFixed(2)}</td>
      <td>
        <span className={`stock-badge ${product.stockQuantity <= 0 ? "empty" : product.stockQuantity <= 3 ? "low" : "in-stock"}`}>
          {product.stockQuantity}
        </span>
      </td>
      <td>
        {product.badge ? (
          <span className="status-badge pending badge-tiny">{product.badge}</span>
        ) : (
          <span className="text-muted">—</span>
        )}
      </td>
      <td>
        <span className="text-muted text-xs">
          {product.images?.length || (product.imageUrl ? 1 : 0)}
        </span>
      </td>
      <td>
        <div className="table-actions">
          <button className="btn btn-secondary product-action-btn btn-xs" onClick={() => onEdit(product)} disabled={isDeleting}>Edit</button>
          <button className={`btn btn-danger product-action-btn btn-xs ${isDeleting ? "loading" : ""}`} onClick={() => onRequestDelete(product)} disabled={isDeleting}>
            {isDeleting && <span className="btn-spinner"></span>}
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </td>
    </tr>
  );
}

function ProductForm({ showForm, formClosing, productForm, productLoading, setFormField, onFormChange, onSave, onToggleForm }: {
  showForm: boolean;
  formClosing: boolean;
  productForm: ProductFormData;
  productLoading: boolean;
  setFormField: (field: keyof ProductFormData, value: string) => void;
  onFormChange: (form: ProductFormData) => void;
  onSave: (e: React.FormEvent) => Promise<void>;
  onToggleForm: () => void;
}) {
  const [newImageUrl, setNewImageUrl] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editUrl, setEditUrl] = useState("");

  const addImage = () => {
    if (!newImageUrl.trim()) return;
    const url = newImageUrl.trim();
    const isFirst = productForm.images.length === 0;
    onFormChange({
      ...productForm,
      images: [
        ...productForm.images,
        { url, isPrimary: isFirst, displayOrder: productForm.images.length },
      ],
    });
    setNewImageUrl("");
  };

  const removeImage = (index: number) => {
    const remaining = productForm.images.filter((_, i) => i !== index);
    const updated = remaining.map((img, i) => ({
      ...img,
      displayOrder: i,
      isPrimary: img.isPrimary,
    }));
    // Ensure at least one primary image
    if (updated.length > 0 && !updated.some((img) => img.isPrimary)) {
      updated[0].isPrimary = true;
    }
    onFormChange({ ...productForm, images: updated });
  };

  const setPrimary = (index: number) => {
    const updated = productForm.images.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    }));
    onFormChange({ ...productForm, images: updated });
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= productForm.images.length) return;
    const updated = [...productForm.images];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    onFormChange({
      ...productForm,
      images: updated.map((img, i) => ({ ...img, displayOrder: i })),
    });
  };

  const startEditImage = (index: number) => {
    setEditingIndex(index);
    setEditUrl(productForm.images[index].url);
  };

  const cancelEditImage = () => {
    setEditingIndex(null);
    setEditUrl("");
  };

  const saveEditImage = (index: number) => {
    const trimmed = editUrl.trim();
    if (!trimmed) return;
    const updated = productForm.images.map((img, i) =>
      i === index ? { ...img, url: trimmed } : img,
    );
    onFormChange({ ...productForm, images: updated });
    setEditingIndex(null);
    setEditUrl("");
  };

  return (
    <div className={`product-form-wrapper ${showForm ? "open" : ""} ${formClosing ? "closing" : ""}`}>
      <div className="product-form-inner">
        <div className="admin-stat-card text-left">
          <h3 className="font-serif mb-20">
            {productForm.id ? "Edit Product" : "Add New Product"}
          </h3>
          <form onSubmit={onSave}>
            <div className="admin-product-form-grid">
              <div className="form-group">
                <label>Name *</label>
                <input type="text" value={productForm.name} onChange={(e) => setFormField("name", e.target.value)} required className="input-cream" />
              </div>
              <div className="form-group">
                <label>SKU</label>
                <input type="text" value={productForm.sku} onChange={(e) => setFormField("sku", e.target.value)} className="input-cream" />
              </div>
              <div className="form-group">
                <label>Price *</label>
                <input type="number" step="0.01" min="0" value={productForm.price} onChange={(e) => setFormField("price", e.target.value)} required className="input-cream" />
              </div>
              <div className="form-group">
                <label>Stock Quantity</label>
                <input type="number" min="0" value={productForm.stockQuantity} onChange={(e) => setFormField("stockQuantity", e.target.value)} className="input-cream" />
              </div>
              <div className="form-group">
                <label>Badge</label>
                <select value={productForm.badge} onChange={(e) => setFormField("badge", e.target.value)} className="input-cream">
                  {BADGE_OPTIONS.map((b) => (<option key={b.value} value={b.value}>{b.label}</option>))}
                </select>
              </div>
              <div className="form-group">
                <label>Primary Image URL</label>
                <input type="url" value={productForm.imageUrl} onChange={(e) => setFormField("imageUrl", e.target.value)} className="input-cream" placeholder="Fallback primary image URL" />
              </div>
              <div className="form-group full-width">
                <label>Description</label>
                <textarea value={productForm.description} onChange={(e) => setFormField("description", e.target.value)} className="input-cream" />
              </div>

              {/* Product Images Section */}
              <div className="form-group full-width">
                <label>Product Images</label>
                <div className="product-image-manager">
                  <div className="image-add-row">
                    <input
                      type="url"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      className="input-cream"
                      placeholder="Enter image URL..."
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addImage(); } }}
                    />
                    <button type="button" className="btn btn-secondary btn-sm" onClick={addImage} disabled={!newImageUrl.trim()}>
                      Add
                    </button>
                  </div>

                  {productForm.images.length > 0 ? (
                    <div className="image-grid-preview">
                      {productForm.images.map((img, idx) => (
                        <div key={idx} className={`image-preview-card ${img.isPrimary ? "primary" : ""} ${editingIndex === idx ? "editing" : ""}`}>
                          <div className="image-preview-thumb">
                            <Image src={img.url} alt={`Product image ${idx + 1}`} width={80} height={80} className="image-preview-img" />
                          </div>
                          <div className="image-preview-info">
                            <span className="image-preview-order">#{idx + 1}</span>
                            {img.isPrimary && <span className="image-primary-badge">Primary</span>}
                          </div>
                          {editingIndex === idx ? (
                            <div className="image-preview-edit">
                              <input
                                type="url"
                                value={editUrl}
                                onChange={(e) => setEditUrl(e.target.value)}
                                className="input-cream image-edit-input"
                                placeholder="Edit image URL..."
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") { e.preventDefault(); saveEditImage(idx); }
                                  if (e.key === "Escape") { cancelEditImage(); }
                                }}
                              />
                              <div className="image-edit-actions">
                                <button type="button" className="btn btn-sm btn-primary" onClick={() => saveEditImage(idx)} disabled={!editUrl.trim()}>
                                  Save
                                </button>
                                <button type="button" className="btn btn-sm btn-secondary" onClick={cancelEditImage}>
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span className="image-preview-url" title={img.url}>{img.url}</span>
                          )}
                          <div className="image-preview-actions">
                            <button
                              type="button"
                              className={`btn btn-xs ${img.isPrimary ? "btn-gold" : "btn-secondary"}`}
                              onClick={() => setPrimary(idx)}
                              disabled={img.isPrimary || editingIndex !== null}
                              title="Set as primary image"
                            >
                              ★
                            </button>
                            <button
                              type="button"
                              className="btn btn-xs btn-secondary"
                              onClick={() => moveImage(idx, -1)}
                              disabled={idx === 0 || editingIndex !== null}
                              title="Move up"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              className="btn btn-xs btn-secondary"
                              onClick={() => moveImage(idx, 1)}
                              disabled={idx === productForm.images.length - 1 || editingIndex !== null}
                              title="Move down"
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              className="btn btn-xs btn-secondary"
                              onClick={() => startEditImage(idx)}
                              disabled={editingIndex !== null}
                              title="Edit image URL"
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              className="btn btn-xs btn-danger"
                              onClick={() => removeImage(idx)}
                              disabled={editingIndex !== null}
                              title="Remove image"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted text-sm">
                      No additional images added. The primary image URL above will be used as the product image.
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="product-form-footer">
              <button type="button" className="btn btn-secondary product-add-btn cancel" onClick={onToggleForm}>
                Cancel
              </button>
              <FormSubmitButton loading={productLoading} isEdit={!!productForm.id} />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function FormSubmitButton({ loading, isEdit }: { loading: boolean; isEdit: boolean }) {
  const label = loading ? (isEdit ? "Updating..." : "Creating...") : (isEdit ? "Update Product" : "Create Product");
  return (
    <button type="submit" className={`btn btn-dark product-action-btn ${loading ? "loading" : ""}`} disabled={loading}>
      {loading && <span className="btn-spinner"></span>}
      {label}
    </button>
  );
}

function PaginationBar({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (page: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="pagination-bar">
      <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>← Prev</button>
      <span className="pagination-text">Page {page} of {totalPages}</span>
      <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next →</button>
    </div>
  );
}
