"use client";

import FallbackImage from "@/src/components/ui/FallbackImage";
import { useState, useEffect } from "react";
import Modal from "@/src/components/ui/Modal";
import ImageLightbox from "@/src/components/ui/ImageLightbox";
import type { Category } from "@/src/lib/api/schemas";
import { PRODUCT_BADGES } from "@/src/lib/constants";
import { isDisplayableImageUrl } from "@/src/lib/product-display";
import { isGiftBoxCategory } from "@/src/lib/gift-box";
import {
  addImage as addImageToSet,
  editImage,
  moveImage as moveImageInSet,
  removeImage as removeImageFromSet,
  setPrimary as setSetPrimary,
} from "@/src/lib/image-set";
import type { ProductFormData } from "@/src/types";

const BADGE_LABELS: Record<(typeof PRODUCT_BADGES)[number], string> = {
  bestseller: "Bestseller",
  new: "New",
  premium: "Premium",
  limited: "Limited",
  luxury: "Luxury",
};

/** Options come from the shared vocabulary, so a new badge needs one edit. */
const BADGE_OPTIONS = [
  { value: "", label: "None" },
  ...PRODUCT_BADGES.map((b) => ({ value: b, label: BADGE_LABELS[b] })),
];

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
  const [newImageUrl, setNewImageUrl] = useState("");
  const inGiftBoxCategory = isGiftBoxCategory(
    categories.find((c) => c.id === Number(productForm.categoryId)),
  );

  // The server rejects bundling on a Gift Box product (assertGiftBoxNotOnBox) and
  // this control is disabled for that category, so a `true` here would make the
  // whole form unsubmittable with no way to clear it — either by switching a
  // product into Gift Boxes with the toggle already on, or by opening a row whose
  // column was seeded true outside this guard. Reconcile instead of dead-ending.
  useEffect(() => {
    if (inGiftBoxCategory && productForm.allowGiftBoxBundling) {
      onFormChange({ ...productForm, allowGiftBoxBundling: false });
    }
  }, [inGiftBoxCategory, productForm, onFormChange]);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [imageUrlError, setImageUrlError] = useState("");
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);

  const openLightbox = (url: string) => setZoomImageUrl(url);

  function setFormField(field: keyof ProductFormData, value: string) {
    onFormChange({ ...productForm, [field]: value });
  }

  // Every image edit is an op from the image-set module, so the admin form and
  // both write routes enforce one invariant instead of four hand-rolled copies.
  const addImage = () => {
    const url = newImageUrl.trim();
    if (!url) return;
    if (!isDisplayableImageUrl(url)) {
      setImageUrlError("Please enter a valid HTTP or HTTPS URL.");
      return;
    }
    setImageUrlError("");
    onFormChange({ ...productForm, images: addImageToSet(productForm.images, url) });
    setNewImageUrl("");
  };

  const removeImage = (index: number) => {
    onFormChange({ ...productForm, images: removeImageFromSet(productForm.images, index) });
  };

  const setPrimary = (index: number) => {
    onFormChange({ ...productForm, images: setSetPrimary(productForm.images, index) });
  };

  const moveImageRow = (index: number, direction: -1 | 1) => {
    onFormChange({ ...productForm, images: moveImageInSet(productForm.images, index, direction) });
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
    if (!isDisplayableImageUrl(trimmed)) {
      setImageUrlError("Please enter a valid HTTP or HTTPS URL.");
      return;
    }
    setImageUrlError("");
    onFormChange({ ...productForm, images: editImage(productForm.images, index, trimmed) });
    setEditingIndex(null);
    setEditUrl("");
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        labelledBy="product-form-modal-title"
        closeOnOverlayClick={false}
        overlayClassName={`modal-overlay ${open ? "active" : ""} ${formClosing ? "closing" : ""}`}
        contentClassName="modal-content product-form-modal"
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
            {/* Section: Product Info */}
            <div className="form-section-group">
              <h3 className="form-section-title">Product Info</h3>
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
              </div>
            </div>

            {/* Section: Pricing & Inventory */}
            <div className="form-section-group">
              <h3 className="form-section-title">Pricing & Inventory</h3>
              <div className="admin-product-form-grid">
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
              </div>
            </div>

            {/* Section: Visibility */}
            <div className="form-section-group">
              <h3 className="form-section-title">Visibility</h3>
              <div className="admin-product-form-grid">
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
                      disabled={inGiftBoxCategory}
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-label">
                      {productForm.allowGiftBoxBundling ? "Enabled" : "Disabled"}
                    </span>
                  </label>
                  {inGiftBoxCategory && (
                    <p className="form-hint">
                      Gift Box products cannot enable bundling
                    </p>
                  )}
                </div>
                <div className="form-group full-width">
                  <label>Visible Hostnames</label>
                  <input type="text" value={productForm.visibleHostnames} onChange={(e) => setFormField("visibleHostnames", e.target.value)} className="input-cream" placeholder="Leave empty for all domains, comma-separated" />
                </div>
              </div>
            </div>

            {/* Section: Description */}
            <div className="form-section-group">
              <h3 className="form-section-title">Description</h3>
              <div className="admin-product-form-grid">
                <div className="form-group full-width">
                  <textarea value={productForm.description} onChange={(e) => setFormField("description", e.target.value)} className="input-cream" rows={6} />
                </div>
              </div>
            </div>

            {/* Section: Images */}
            <div className="form-section-group">
              <h3 className="form-section-title">Images</h3>
              <div className="admin-product-form-grid">
                <div className="form-group">
                  <label>Primary Image URL</label>
                  <input type="url" value={productForm.imageUrl} onChange={(e) => setFormField("imageUrl", e.target.value)} className="input-cream" placeholder="Fallback primary image URL" />
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
                                if (isDisplayableImageUrl(img.url)) {
                                  openLightbox(img.url);
                                }
                              }}
                              title="Click to view high-res preview"
                            >
                              {/* FallbackImage owns load failure — it swaps in the
                                  shared placeholder itself, per src. */}
                              {isDisplayableImageUrl(img.url) ? (
                                <>
                                  <FallbackImage src={img.url} alt={`Product image ${idx + 1}`} width={300} height={300} className="image-preview-img" />
                                  <div className="image-zoom-overlay">
                                    <span>🔍 Inspect</span>
                                  </div>
                                </>
                              ) : (
                                <div className="product-img-placeholder" style={{ width: "100%", height: "100%" }} title="Invalid image URL" />
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
                                onClick={() => moveImageRow(idx, -1)}
                                disabled={idx === 0 || editingIndex !== null}
                                title="Move left"
                              >
                                ←
                              </button>
                              <button
                                type="button"
                                className="btn btn-xs btn-secondary"
                                onClick={() => moveImageRow(idx, 1)}
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
            </div>
            <div className="product-form-footer">
              <button type="button" className="btn btn-secondary product-add-btn cancel" onClick={onClose}>
                Cancel
              </button>
              <FormSubmitButton loading={productLoading} isEdit={!!productForm.id} />
            </div>
          </form>
        </div>
      </Modal>

      {/* High-Res Preview — the shared viewer; zoom is core behavior, not
          a private wheel handler. Single-image list: no nav, zoom controls on. */}
      {zoomImageUrl && (
        <ImageLightbox
          images={[zoomImageUrl]}
          alt="Product image preview"
          onClose={() => setZoomImageUrl(null)}
          zoom
        />
      )}
    </>
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
