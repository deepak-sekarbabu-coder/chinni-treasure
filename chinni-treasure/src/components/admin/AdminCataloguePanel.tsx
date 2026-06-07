"use client";

import Image from "next/image";
import type { Product } from "@/src/lib/api-schemas";

interface ProductFormData {
  id: string;
  name: string;
  sku: string;
  description: string;
  price: string;
  stockQuantity: string;
  imageUrl: string;
  badge: string;
  categoryId: string;
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
      <div className="product-form-actions">
        <button
          className={`btn ${showForm ? "btn-secondary product-add-btn cancel" : "btn-primary product-add-btn"}`}
          onClick={onToggleForm}
        >
          {showForm ? "✕ Cancel" : "+ Add Product"}
        </button>
      </div>

      <ProductForm showForm={showForm} formClosing={formClosing} productForm={productForm} productLoading={productLoading} setFormField={setFormField} onSave={onSave} />

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
  return (
    <tr className={`product-table-row ${isDeleting ? "removing" : ""}`}>
      <td>
        {product.imageUrl ? (
          <Image src={product.imageUrl} alt={product.name} width={40} height={50} className="product-img" />
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

function ProductForm({ showForm, formClosing, productForm, productLoading, setFormField, onSave }: {
  showForm: boolean;
  formClosing: boolean;
  productForm: ProductFormData;
  productLoading: boolean;
  setFormField: (field: keyof ProductFormData, value: string) => void;
  onSave: (e: React.FormEvent) => Promise<void>;
}) {
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
                <label>Image URL</label>
                <input type="url" value={productForm.imageUrl} onChange={(e) => setFormField("imageUrl", e.target.value)} className="input-cream" />
              </div>
              <div className="form-group">
                <label>Badge</label>
                <select value={productForm.badge} onChange={(e) => setFormField("badge", e.target.value)} className="input-cream">
                  {BADGE_OPTIONS.map((b) => (<option key={b.value} value={b.value}>{b.label}</option>))}
                </select>
              </div>
              <div className="form-group full-width">
                <label>Description</label>
                <textarea value={productForm.description} onChange={(e) => setFormField("description", e.target.value)} className="input-cream" />
              </div>
            </div>
            <SubmitButton loading={productLoading} isEdit={!!productForm.id} />
          </form>
        </div>
      </div>
    </div>
  );
}

function SubmitButton({ loading, isEdit }: { loading: boolean; isEdit: boolean }) {
  const label = loading ? (isEdit ? "Updating..." : "Creating...") : (isEdit ? "Update Product" : "Create Product");
  return (
    <button type="submit" className={`btn btn-dark product-action-btn mt-16 ${loading ? "loading" : ""}`} disabled={loading}>
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
