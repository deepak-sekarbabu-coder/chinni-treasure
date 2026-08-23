"use client";

import FallbackImage from "@/src/components/ui/FallbackImage";
import { useState, useCallback } from "react";
import { useFocusTrap } from "@/src/lib/useFocusTrap";
import type { Category } from "@/src/lib/api/schemas";
import type { ProductFormData } from "@/src/components/admin/AdminCataloguePanel";

const BADGE_OPTIONS = [
  { value: "", label: "None" },
  { value: "bestseller", label: "Bestseller" },
  { value: "new", label: "New" },
  { value: "premium", label: "Premium" },
  { value: "limited", label: "Limited" },
  { value: "luxury", label: "Luxury" },
];

function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

interface Props {
  open: boolean;
  formClosing: boolean;
  productForm: ProductFormData;
  productLoading: boolean;
  categories: Category[];
  categoriesLoading: boolean;
  onFormChange: (form: ProductFormData) => void;
  onSave: (e: React.FormEvent) => Promise<void>;
  onClose: () => void;
}

export default function ProductFormModal({
  open,
  formClosing,
  productForm,
  productLoading,
  categories,
  categoriesLoading,
  onFormChange,
  onSave,
  onClose,
}: Props) {
  const trapRef = useFocusTrap(open);
  const [newImageUrl, setNewImageUrl] = useState("");
  const isGiftBoxCategory = categories.find(
    (c) => c.id === Number(productForm.categoryId)
  )?.slug === "box";
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [imageUrlError, setImageUrlError] = useState("");
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const ZOOM_MIN = 0.5;
  const ZOOM_MAX = 3;
  const ZOOM_STEP = 0.25;

  const zoomIn = useCallback(() => setZoomLevel((z) => Math.min(z + ZOOM_STEP, ZOOM_MAX)), []);
  const zoomOut = useCallback(() => setZoomLevel((z) => Math.max(z - ZOOM_STEP, ZOOM_MIN)), []);
  const zoomReset = useCallback(() => setZoomLevel(1), []);

  const handleLightboxWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoomLevel((z) => Math.min(z + ZOOM_STEP, ZOOM_MAX));
    } else {
      setZoomLevel((z) => Math.max(z - ZOOM_STEP, ZOOM_MIN));
    }
  }, []);

  const openLightbox = useCallback((url: string) => {
    setZoomImageUrl(url);
    setZoomLevel(1);
  }, []);

  function setFormField(field: keyof ProductFormData, value: string) {
    onFormChange({ ...productForm, [field]: value });
  }

  const addImage = () => {
    const url = newImageUrl.trim();
    if (!url) return;
    if (!isValidImageUrl(url)) {
      setImageUrlError("Please enter a valid HTTP or HTTPS URL.");
      return;
    }
    setImageUrlError("");
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
    setFailedImages((prev) => {
      const next = new Set<number>();
      for (const i of prev) {
        if (i < index) next.add(i);
        else if (i > index) next.add(i - 1);
      }
      return next;
    });
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
    if (!isValidImageUrl(trimmed)) {
      setImageUrlError("Please enter a valid HTTP or HTTPS URL.");
      return;
    }
    setImageUrlError("");
    const updated = productForm.images.map((img, i) =>
      i === index ? { ...img, url: trimmed } : img,
    );
    setFailedImages((prev) => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
    onFormChange({ ...productForm, images: updated });
    setEditingIndex(null);
    setEditUrl("");
  };

  const handleImageError = (index: number) => {
    setFailedImages((prev) => new Set(prev).add(index));
  };

  return (
    <div
      className={`modal-overlay ${open ? "active" : ""} ${formClosing ? "closing" : ""}`}
      ref={trapRef}
      aria-hidden={!open}
    >
      <div
        className="modal-content product-form-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-form-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="product-form-modal-title" className="font-serif">
            {productForm.id ? "Edit Product" : "Add New Product"}
          </h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={onSave} className="product-form-modal-form">
            <div className="admin-product-form-grid">
              <div className="form-group">
                <label>Name *</label>
                <input type="text" value={productForm.name} onChange={(e) => setFormField("name", e.target.value)} required className="input-cream" />
              </div>
              <div className="form-group">
                <label>Code</label>
                <input type="text" value={productForm.sku} onChange={(e) => setFormField("sku", e.target.value)} className="input-cream" />
              </div>
              <div className="form-group">
                <label>Price *</label>
                <input type="number" step="0.01" min="0" value={productForm.price} onChange={(e) => setFormField("price", e.target.value)} required className="input-cream" />
              </div>
              <div className="form-group">
                <label>Compare At Price (MRP)</label>
                <input type="number" step="0.01" min="0" value={productForm.compareAtPrice} onChange={(e) => setFormField("compareAtPrice", e.target.value)} className="input-cream" placeholder="Original price before discount" />
              </div>
              <div className="form-group">
                <label>Stock Quantity</label>
                <input type="number" min="0" value={productForm.stockQuantity} onChange={(e) => setFormField("stockQuantity", e.target.value)} className="input-cream" />
              </div>
              <div className="form-group toggle-form-group">
                <label>Active Status</label>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={productForm.isActive}
                    onChange={(e) => onFormChange({ ...productForm, isActive: e.target.checked })}
                  />
                  <span className="toggle-slider"></span>
                  <span className="toggle-label">{productForm.isActive ? "Active" : "Inactive"}</span>
                </label>
              </div>
              <div className="form-group toggle-form-group">
                <label>Gift-Box Bundling</label>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={productForm.allowGiftBoxBundling}
                    onChange={(e) => onFormChange({ ...productForm, allowGiftBoxBundling: e.target.checked })}
                    disabled={isGiftBoxCategory}
                  />
                  <span className="toggle-slider"></span>
                  <span className="toggle-label">
                    {productForm.allowGiftBoxBundling ? "Enabled" : "Disabled"}
                  </span>
                </label>
                {isGiftBoxCategory && (
                  <p className="form-hint" style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "4px" }}>
                    Gift Box products cannot enable bundling
                  </p>
                )}
              </div>
              <div className="form-group">
                <label>Category</label>
                <select value={productForm.categoryId} onChange={(e) => setFormField("categoryId", e.target.value)} className="input-cream" disabled={categoriesLoading}>
                  <option value="">{categoriesLoading ? "Loading..." : "None"}</option>
                  {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                </select>
              </div>
              <div className="form-group">
                <label>Badge</label>
                <select value={productForm.badge} onChange={(e) => setFormField("badge", e.target.value)} className="input-cream">
                  {BADGE_OPTIONS.map((b) => (<option key={b.value} value={b.value}>{b.label}</option>))}
                </select>
              </div>
              <div className="form-group">
                <label>Visible Hostnames</label>
                <input type="text" value={productForm.visibleHostnames} onChange={(e) => setFormField("visibleHostnames", e.target.value)} className="input-cream" placeholder="Leave empty for all domains, comma-separated" />
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
                      onChange={(e) => { setNewImageUrl(e.target.value); setImageUrlError(""); }}
                      className="input-cream"
                      placeholder="Enter image URL..."
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addImage(); } }}
                    />
                    <button type="button" className="btn btn-secondary btn-sm" onClick={addImage} disabled={!newImageUrl.trim()}>
                      Add
                    </button>
                  </div>
                  {imageUrlError && <p className="text-danger text-sm mt-4">{imageUrlError}</p>}

                  {productForm.images.length > 0 ? (
                    <div className="image-grid-preview">
                      {productForm.images.map((img, idx) => (
                        <div key={idx} className={`image-preview-card ${img.isPrimary ? "primary" : ""} ${editingIndex === idx ? "editing" : ""}`}>
                          <div className="image-preview-card-header">
                            <span className="image-preview-order">#{idx + 1}</span>
                            {img.isPrimary && <span className="image-primary-badge">★ Primary</span>}
                          </div>
                          <div
                            className="image-preview-thumb"
                            onClick={() => {
                              if (!failedImages.has(idx) && isValidImageUrl(img.url)) {
                                openLightbox(img.url);
                              }
                            }}
                            title="Click to view high-res preview"
                          >
                            {failedImages.has(idx) || !isValidImageUrl(img.url) ? (
                              <div className="product-img-placeholder" style={{ width: "100%", height: "100%" }} title={!isValidImageUrl(img.url) ? "Invalid image URL" : "Image failed to load"} />
                            ) : (
                              <>
                                <FallbackImage src={img.url} alt={`Product image ${idx + 1}`} width={300} height={300} className="image-preview-img" onError={() => handleImageError(idx)} />
                                <div className="image-zoom-overlay">
                                  <span>🔍 Inspect</span>
                                </div>
                              </>
                            )}
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
                              title={img.isPrimary ? "Primary image" : "Set as primary image"}
                            >
                              ★
                            </button>
                            <button
                              type="button"
                              className="btn btn-xs btn-secondary"
                              onClick={() => moveImage(idx, -1)}
                              disabled={idx === 0 || editingIndex !== null}
                              title="Move left"
                            >
                              ←
                            </button>
                            <button
                              type="button"
                              className="btn btn-xs btn-secondary"
                              onClick={() => moveImage(idx, 1)}
                              disabled={idx === productForm.images.length - 1 || editingIndex !== null}
                              title="Move right"
                            >
                              →
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
                              className="btn btn-xs btn-danger image-delete-btn"
                              onClick={() => removeImage(idx)}
                              disabled={editingIndex !== null}
                              title="Delete image"
                            >
                              🗑️
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
              <button type="button" className="btn btn-secondary product-add-btn cancel" onClick={onClose}>
                Cancel
              </button>
              <FormSubmitButton loading={productLoading} isEdit={!!productForm.id} />
            </div>
          </form>
        </div>
      </div>

      {/* Lightbox / High-Res Preview Overlay */}
      {zoomImageUrl && (
        <div className="lightbox-overlay" onClick={() => setZoomImageUrl(null)} onWheel={handleLightboxWheel} style={{ opacity: 1, visibility: "visible" }}>
          <div className="lightbox-container" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="lightbox-close" onClick={() => setZoomImageUrl(null)} aria-label="Close high-res preview">
              ✕
            </button>
            <div className="lightbox-zoom-controls">
              <button type="button" className="lightbox-zoom-btn" onClick={zoomOut} disabled={zoomLevel <= ZOOM_MIN} aria-label="Zoom out" title="Zoom out">
                −
              </button>
              <span className="lightbox-zoom-level">{Math.round(zoomLevel * 100)}%</span>
              <button type="button" className="lightbox-zoom-btn" onClick={zoomIn} disabled={zoomLevel >= ZOOM_MAX} aria-label="Zoom in" title="Zoom in">
                +
              </button>
              {zoomLevel !== 1 && (
                <button type="button" className="lightbox-zoom-btn lightbox-zoom-reset" onClick={zoomReset} aria-label="Reset zoom" title="Reset zoom">
                  Reset
                </button>
              )}
            </div>
            <div className="lightbox-image-wrapper">
              <FallbackImage src={zoomImageUrl} alt="Full resolution product image preview" width={800} height={800} className="lightbox-image" style={{ transform: `scale(${zoomLevel})`, transition: "transform 0.2s ease" }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormSubmitButton({ loading, isEdit }: { loading: boolean; isEdit: boolean }) {
  return (
    <button type="submit" className={`btn btn-primary product-add-btn ${loading ? "loading" : ""}`} disabled={loading}>
      {loading && <span className="btn-spinner"></span>}
      {loading ? (isEdit ? "Saving..." : "Adding...") : (isEdit ? "Save Changes" : "Add Product")}
    </button>
  );
}
