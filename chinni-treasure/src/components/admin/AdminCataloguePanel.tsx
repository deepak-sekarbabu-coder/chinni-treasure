"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import type { Category, Product } from "@/src/lib/api/schemas";
import type { ProductFilters } from "@/app/admin/useAdminPageState";
import ProductFormModal from "@/src/components/admin/ProductFormModal";

export interface ProductFormData {
  id: string;
  name: string;
  sku: string;
  description: string;
  price: string;
  compareAtPrice: string;
  stockQuantity: string;
  imageUrl: string;
  badge: string;
  categoryId: string;
  isActive: boolean;
  images: Array<{ url: string; isPrimary: boolean; displayOrder: number }>;
}

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
  categories: Category[];
  categoriesLoading: boolean;
  filters: ProductFilters;
  onFilterChange: (updates: Partial<ProductFilters>) => void;
  onFilterReset: () => void;
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
  categories,
  categoriesLoading: _categoriesLoading,
  filters,
  onFilterChange,
  onFilterReset,
  onToggleForm,
  onFormChange,
  onSave,
  onEdit,
  onRequestDelete,
  onPageChange,
}: Props) {
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFilterChange({ search: e.target.value });
    },
    [onFilterChange],
  );

  const hasActiveFilters = filters.search || filters.categoryId || filters.badge !== "all" || filters.sort !== "newest";

  return (
    <div id="panel-catalogue" role="tabpanel" aria-labelledby="tab-catalogue">
      <div className="product-form-actions">
        <button className="btn btn-primary product-add-btn" onClick={onToggleForm}>
          + Add Product
        </button>
      </div>

      <ProductFormModal open={showForm} formClosing={formClosing} productForm={productForm} productLoading={productLoading} categories={categories} categoriesLoading={_categoriesLoading} onFormChange={onFormChange} onSave={onSave} onClose={onToggleForm} />

      <div className="admin-catalogue-filters">
        <div className="admin-catalogue-search">
          <input
            type="text"
            className="admin-catalogue-search-input"
            placeholder="Search by name or SKU..."
            value={filters.search}
            onChange={handleSearchChange}
            aria-label="Search products"
          />
        </div>

        <div className="admin-catalogue-filter-group">
          <select
            className="admin-catalogue-select"
            value={filters.categoryId}
            onChange={(e) => onFilterChange({ categoryId: e.target.value ? Number(e.target.value) : "" })}
            aria-label="Filter by category"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            className="admin-catalogue-select"
            value={filters.badge}
            onChange={(e) => onFilterChange({ badge: e.target.value })}
            aria-label="Filter by badge"
          >
            <option value="all">All Badges</option>
            <option value="bestseller">Bestseller</option>
            <option value="new">New</option>
            <option value="premium">Premium</option>
            <option value="limited">Limited</option>
            <option value="luxury">Luxury</option>
          </select>

          <select
            className="admin-catalogue-select"
            value={filters.sort}
            onChange={(e) => onFilterChange({ sort: e.target.value })}
            aria-label="Sort products"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name-asc">Name A–Z</option>
            <option value="name-desc">Name Z–A</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
            <option value="stock-desc">Stock: High → Low</option>
            <option value="stock-asc">Stock: Low → High</option>
            <option value="sku-asc">Code: A–Z</option>
            <option value="sku-desc">Code: Z–A</option>
          </select>

          {hasActiveFilters && (
            <button className="btn btn-secondary btn-sm" onClick={onFilterReset}>
              Clear Filters
            </button>
          )}
        </div>
      </div>

      <div className="admin-product-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Code</th>
              <th>Price</th>
              <th>MRP</th>
              <th>Stock</th>
              <th>Badge</th>
              <th>Images</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {productsLoading ? (
              <SkeletonRows />
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={10} className="empty-state">
                  No products match your filters.
                </td>
              </tr>
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
      <td><div className="skeleton-text" style={{ width: "50px" }} /></td>
      <td><div className="skeleton-text skeleton-text-stock" /></td>
      <td><div className="skeleton-text skeleton-text-badge" /></td>
      <td><div className="skeleton-text" style={{ width: "30px" }} /></td>
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
  const [imgFailed, setImgFailed] = useState(false);
  const hasValidImage = primaryImage && !imgFailed && /^https?:\/\//.test(primaryImage);
  return (
    <tr className={`product-table-row ${isDeleting ? "removing" : ""}`}>
      <td>
        {hasValidImage ? (
          <Image src={primaryImage} alt={product.name} width={40} height={50} className="product-img" onError={() => setImgFailed(true)} />
        ) : (
          <div className="product-img-placeholder" />
        )}
      </td>
      <td className="fw-500">{product.name}</td>
      <td className="font-mono text-xs text-muted">{product.sku || "—"}</td>
      <td className="text-gold-dark fw-600">₹{Number(product.price).toFixed(2)}</td>
      <td className="text-muted">
        {product.compareAtPrice ? (
          <span style={{ textDecoration: "line-through" }}>₹{Number(product.compareAtPrice).toFixed(2)}</span>
        ) : (
          <span className="text-muted">—</span>
        )}
      </td>
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
      <td className="active-cell">
        <span className={`status-badge ${product.isActive ? "delivered" : "rejected"}`}>
          {product.isActive ? "Active" : "Inactive"}
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
