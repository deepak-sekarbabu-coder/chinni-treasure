"use client";

import Image from "next/image";

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  description: string;
  stockQuantity: number;
  badge: string | null;
  category: { name: string } | null;
  categoryId: number | null;
  sku: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

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
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setFormField("name", e.target.value)}
                    required
                    className="input-cream"
                  />
                </div>
                <div className="form-group">
                  <label>SKU</label>
                  <input
                    type="text"
                    value={productForm.sku}
                    onChange={(e) => setFormField("sku", e.target.value)}
                    className="input-cream"
                  />
                </div>
                <div className="form-group">
                  <label>Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={productForm.price}
                    onChange={(e) => setFormField("price", e.target.value)}
                    required
                    className="input-cream"
                  />
                </div>
                <div className="form-group">
                  <label>Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.stockQuantity}
                    onChange={(e) => setFormField("stockQuantity", e.target.value)}
                    className="input-cream"
                  />
                </div>
                <div className="form-group">
                  <label>Image URL</label>
                  <input
                    type="url"
                    value={productForm.imageUrl}
                    onChange={(e) => setFormField("imageUrl", e.target.value)}
                    className="input-cream"
                  />
                </div>
                <div className="form-group">
                  <label>Badge</label>
                  <select
                    value={productForm.badge}
                    onChange={(e) => setFormField("badge", e.target.value)}
                    className="input-cream"
                  >
                    {BADGE_OPTIONS.map((b) => (
                      <option key={b.value} value={b.value}>{b.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) => setFormField("description", e.target.value)}
                    className="input-cream"
                  />
                </div>
              </div>
              <button
                type="submit"
                className={`btn btn-dark product-action-btn mt-16 ${productLoading ? "loading" : ""}`}
                disabled={productLoading}
              >
                {productLoading && <span className="btn-spinner"></span>}
                {productLoading
                  ? (productForm.id ? "Updating..." : "Creating...")
                  : (productForm.id ? "Update Product" : "Create Product")
                }
              </button>
            </form>
          </div>
        </div>
      </div>

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
              Array.from({ length: 5 }).map((_, idx) => (
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
              ))
            ) : (
              products.map((p) => {
                const isDeleting = loadingProductId === p.id;
                return (
                  <tr key={p.id} className={`product-table-row ${isDeleting ? "removing" : ""}`}>
                    <td>
                      {p.imageUrl ? (
                        <Image src={p.imageUrl} alt={p.name} width={40} height={50} className="product-img" />
                      ) : (
                        <div className="product-img-placeholder" />
                      )}
                    </td>
                    <td className="fw-500">{p.name}</td>
                    <td className="font-mono text-xs text-muted">{p.sku || "—"}</td>
                    <td className="text-gold-dark fw-600">₹{Number(p.price).toFixed(2)}</td>
                    <td>
                      <span className={`stock-badge ${p.stockQuantity <= 0 ? "empty" : p.stockQuantity <= 3 ? "low" : "in-stock"}`}>
                        {p.stockQuantity}
                      </span>
                    </td>
                    <td>
                      {p.badge ? (
                        <span className="status-badge pending badge-tiny">{p.badge}</span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-secondary product-action-btn btn-xs" onClick={() => onEdit(p)} disabled={isDeleting}>
                          Edit
                        </button>
                        <button className={`btn btn-danger product-action-btn btn-xs ${isDeleting ? "loading" : ""}`} onClick={() => onRequestDelete(p)} disabled={isDeleting}>
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

      {productTotalPages > 1 && (
        <div className="pagination-bar">
          <button
            className="btn btn-secondary btn-sm"
            disabled={productPage <= 1}
            onClick={() => onPageChange(productPage - 1)}
          >
            ← Prev
          </button>
          <span className="pagination-text">Page {productPage} of {productTotalPages}</span>
          <button
            className="btn btn-secondary btn-sm"
            disabled={productPage >= productTotalPages}
            onClick={() => onPageChange(productPage + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
