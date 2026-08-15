"use client";

import FallbackImage from "@/src/components/ui/FallbackImage";
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
  visibleHostnames: string;
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
  const [lightboxProduct, setLightboxProduct] = useState<Product | null>(null);

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
          {filters.search && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => onFilterChange({ search: "" })}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
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

      {/* Summary Bar & Active Filters */}
      <div className="admin-catalogue-summary-bar">
        <span className="summary-count-text">
          Showing <strong>{products.length}</strong> product{products.length === 1 ? "" : "s"}
        </span>
        {hasActiveFilters && (
          <div className="active-filter-chips">
            {filters.search && (
              <span className="filter-chip">
                Search: &quot;{filters.search}&quot;
                <button type="button" onClick={() => onFilterChange({ search: "" })}>✕</button>
              </span>
            )}
            {filters.categoryId && (
              <span className="filter-chip">
                Category: {categories.find((c) => c.id === filters.categoryId)?.name || filters.categoryId}
                <button type="button" onClick={() => onFilterChange({ categoryId: "" })}>✕</button>
              </span>
            )}
            {filters.badge !== "all" && (
              <span className="filter-chip">
                Badge: {filters.badge}
                <button type="button" onClick={() => onFilterChange({ badge: "all" })}>✕</button>
              </span>
            )}
          </div>
        )}
      </div>

      <div className="admin-product-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Code</th>
              <th>Price & MRP</th>
              <th>Stock</th>
              <th>Badge</th>
              <th>Gallery</th>
              <th>Status</th>
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
                <ProductRow
                  key={p.id}
                  product={p}
                  loadingProductId={loadingProductId}
                  onEdit={onEdit}
                  onRequestDelete={onRequestDelete}
                  onPreviewImages={(product) => setLightboxProduct(product)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <PaginationBar page={productPage} totalPages={productTotalPages} onPageChange={onPageChange} />

      {/* Table Image Gallery Lightbox Modal */}
      {lightboxProduct && (
        <CatalogueProductLightbox
          product={lightboxProduct}
          onClose={() => setLightboxProduct(null)}
        />
      )}
    </div>
  );
}

function SkeletonRows() {
  return Array.from({ length: 5 }).map((_, idx) => (
    <tr key={`skeleton-${idx}`} className="product-table-skeleton"
      style={{ animationDelay: `${idx * 0.06}s` }}
    >
      <td><div className="skeleton-block" style={{ width: "52px", height: "52px", borderRadius: "6px" }} /></td>
      <td><div className="skeleton-text skeleton-text-name" /></td>
      <td><div className="skeleton-text" style={{ width: "70px" }} /></td>
      <td><div className="skeleton-text skeleton-text-sku" /></td>
      <td><div className="skeleton-text skeleton-text-price" /></td>
      <td><div className="skeleton-text skeleton-text-stock" /></td>
      <td><div className="skeleton-text skeleton-text-badge" /></td>
      <td><div className="skeleton-text" style={{ width: "40px" }} /></td>
      <td><div className="skeleton-text" style={{ width: "50px" }} /></td>
      <td>
        <div className="table-actions">
          <div className="skeleton-block" style={{ width: "50px", height: "28px", borderRadius: "4px" }} />
          <div className="skeleton-block" style={{ width: "60px", height: "28px", borderRadius: "4px" }} />
        </div>
      </td>
    </tr>
  ));
}

function ProductRow({
  product,
  loadingProductId,
  onEdit,
  onRequestDelete,
  onPreviewImages,
}: {
  product: Product;
  loadingProductId: string | null;
  onEdit: (p: Product) => void;
  onRequestDelete: (p: Product) => void;
  onPreviewImages: (p: Product) => void;
}) {
  const isDeleting = loadingProductId === product.id;
  const primaryImage = product.images?.find((img) => img.isPrimary)?.url || product.imageUrl;
  const [imgFailed, setImgFailed] = useState(false);
  const hasValidImage = primaryImage && !imgFailed && /^https?:\/\//.test(primaryImage);

  const priceNum = Number(product.price) || 0;
  const compareNum = Number(product.compareAtPrice) || 0;
  const hasDiscount = compareNum > priceNum;
  const savingsPercent = hasDiscount ? Math.round(((compareNum - priceNum) / compareNum) * 100) : 0;
  const imageCount = product.images?.length || (product.imageUrl ? 1 : 0);

  return (
    <tr className={`product-table-row ${isDeleting ? "removing" : ""}`}>
      <td className="table-img-cell">
        <div
          className="table-img-wrapper"
          onClick={() => onPreviewImages(product)}
          title="Click to view full image gallery"
        >
          {hasValidImage ? (
            <FallbackImage src={primaryImage} alt={product.name} width={52} height={52} className="product-table-img" onError={() => setImgFailed(true)} />
          ) : (
            <div className="product-img-placeholder" style={{ width: 52, height: 52 }} />
          )}
          <div className="table-img-zoom-hint">🔍</div>
        </div>
      </td>
      <td className="fw-500 table-name-cell">{product.name}</td>
      <td>
        {product.category?.name ? (
          <span className="category-pill-badge">{product.category.name}</span>
        ) : (
          <span className="text-muted text-xs">—</span>
        )}
      </td>
      <td className="font-mono text-xs text-muted">
        {product.sku ? <code className="sku-code">{product.sku}</code> : "—"}
      </td>
      <td className="table-price-cell">
        <div className="price-primary">₹{priceNum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
        {hasDiscount && (
          <div className="price-secondary">
            <span className="price-mrp">₹{compareNum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            <span className="discount-badge">-{savingsPercent}%</span>
          </div>
        )}
      </td>
      <td>
        <span className={`stock-health-badge ${product.stockQuantity <= 0 ? "out-of-stock" : product.stockQuantity <= 3 ? "low-stock" : "in-stock"}`}>
          <span className="stock-dot" />
          {product.stockQuantity <= 0 ? "Out of stock" : product.stockQuantity <= 3 ? `Low (${product.stockQuantity})` : `${product.stockQuantity} in stock`}
        </span>
      </td>
      <td>
        {product.badge ? (
          <span className={`luxury-badge badge-${product.badge.toLowerCase()}`}>
            {product.badge}
          </span>
        ) : (
          <span className="text-muted text-xs">—</span>
        )}
      </td>
      <td>
        <button
          type="button"
          className="image-count-pill"
          onClick={() => onPreviewImages(product)}
          title="Click to preview gallery images"
        >
          🖼️ {imageCount}
        </button>
      </td>
      <td className="active-cell">
        <span className={`table-status-pill ${product.isActive ? "active" : "inactive"}`}>
          <span className="status-dot" />
          {product.isActive ? "Active" : "Inactive"}
        </span>
      </td>
      <td>
        <div className="table-actions">
          <button className="btn btn-secondary product-action-btn btn-xs" onClick={() => onEdit(product)} disabled={isDeleting} title="Edit product">
            ✏️ Edit
          </button>
          <button className={`btn btn-danger product-action-btn btn-xs ${isDeleting ? "loading" : ""}`} onClick={() => onRequestDelete(product)} disabled={isDeleting} title="Delete product">
            {isDeleting ? "..." : "🗑️ Delete"}
          </button>
        </div>
      </td>
    </tr>
  );
}

function CatalogueProductLightbox({ product, onClose }: { product: Product; onClose: () => void }) {
  const images = product.images && product.images.length > 0
    ? product.images.map((img) => img.url)
    : product.imageUrl
      ? [product.imageUrl]
      : [];

  const [activeIdx, setActiveIdx] = useState(0);
  const currentUrl = images[activeIdx] || "";

  return (
    <div className="lightbox-overlay active" onClick={onClose} style={{ opacity: 1, visibility: "visible" }}>
      <div className="lightbox-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
        <button type="button" className="lightbox-close" onClick={onClose} aria-label="Close preview">
          ✕
        </button>
        <div className="catalogue-lightbox-card">
          <div className="catalogue-lightbox-header">
            <h3>{product.name}</h3>
            {product.category?.name && <span className="category-pill-badge">{product.category.name}</span>}
          </div>
          <div className="catalogue-lightbox-main-img">
            {currentUrl ? (
              <FallbackImage src={currentUrl} alt={product.name} width={500} height={500} className="lightbox-image" />
            ) : (
              <div className="product-img-placeholder" style={{ width: 250, height: 250 }} />
            )}
          </div>
          {images.length > 1 && (
            <div className="catalogue-lightbox-thumbs">
              {images.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`catalogue-lightbox-thumb ${idx === activeIdx ? "active" : ""}`}
                  onClick={() => setActiveIdx(idx)}
                >
                  <FallbackImage src={url} alt={`Preview ${idx + 1}`} width={60} height={60} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
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
