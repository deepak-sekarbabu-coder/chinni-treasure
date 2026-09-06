"use client";

import FallbackImage from "@/src/components/ui/FallbackImage";
import { formatINR } from "@/src/lib/format";
import { CaretLeft, CaretRight, Images, PencilSimple, Trash, X } from "@phosphor-icons/react";
import { useCallback, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  type SortingState,
  type OnChangeFn,
} from "@tanstack/react-table";
import AdminDataTable from "@/src/components/admin/table/AdminDataTable";
import {
  apiSortToSorting,
  sortingToApiSort,
  createCatalogueColumns,
} from "@/src/components/admin/table/columns.catalogue";
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
  allowGiftBoxBundling: boolean;
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

  const sorting = useMemo(() => apiSortToSorting(filters.sort), [filters.sort]);

  const handleSortingChange: OnChangeFn<SortingState> = useCallback(
    (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      onFilterChange({ sort: sortingToApiSort(next) });
    },
    [sorting, onFilterChange],
  );

  const columns = useMemo(
    () =>
      createCatalogueColumns({
        loadingProductId,
        onPreviewImages: setLightboxProduct,
        onEdit,
        onRequestDelete,
      }),
    [loadingProductId, onEdit, onRequestDelete],
  );

  const table = useReactTable({
    data: products,
    columns,
    state: { sorting, pagination: { pageIndex: productPage - 1, pageSize: 5 } },
    onSortingChange: handleSortingChange,
    manualSorting: true,
    manualPagination: true,
    sortDescFirst: false,
    pageCount: productTotalPages,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFilterChange({ search: e.target.value });
    },
    [onFilterChange],
  );

  const hasActiveFilters =
    filters.search ||
    filters.categoryId ||
    filters.badge !== "all" ||
    filters.status !== "all" ||
    filters.sort !== "newest";

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
              <X size={14} weight="bold" aria-hidden="true" />
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
            value={filters.status}
            onChange={(e) => onFilterChange({ status: e.target.value as ProductFilters["status"] })}
            aria-label="Filter by active status"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
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
                <button type="button" onClick={() => onFilterChange({ search: "" })}><X size={12} weight="bold" aria-hidden="true" /></button>
              </span>
            )}
            {filters.categoryId && (
              <span className="filter-chip">
                Category: {categories.find((c) => c.id === filters.categoryId)?.name || filters.categoryId}
                <button type="button" onClick={() => onFilterChange({ categoryId: "" })}><X size={12} weight="bold" aria-hidden="true" /></button>
              </span>
            )}
            {filters.badge !== "all" && (
              <span className="filter-chip">
                Badge: {filters.badge}
                <button type="button" onClick={() => onFilterChange({ badge: "all" })}><X size={12} weight="bold" aria-hidden="true" /></button>
              </span>
            )}
            {filters.status !== "all" && (
              <span className="filter-chip">
                Status: {filters.status === "active" ? "Active" : "Inactive"}
                <button type="button" onClick={() => onFilterChange({ status: "all" })}><X size={12} weight="bold" aria-hidden="true" /></button>
              </span>
            )}
          </div>
        )}
      </div>

      <AdminDataTable
        table={table}
        isLoading={productsLoading}
        skeletonRowCount={5}
        emptyMessage="No products match your filters."
      />

      <CatalogueCards
        products={products}
        loading={productsLoading}
        loadingProductId={loadingProductId}
        onPreviewImages={setLightboxProduct}
        onEdit={onEdit}
        onRequestDelete={onRequestDelete}
      />

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

function CatalogueProductLightbox({ product, onClose }: { product: Product; onClose: () => void }) {
  const images = product.images && product.images.length > 0
    ? product.images.map((img) => img.url)
    : product.imageUrl
      ? [product.imageUrl]
      : [];

  const [activeIdx, setActiveIdx] = useState(0);
  const currentUrl = images[activeIdx] || "";
  const hasMultiple = images.length > 1;

  const goPrev = () => setActiveIdx((i) => (i - 1 + images.length) % images.length);
  const goNext = () => setActiveIdx((i) => (i + 1) % images.length);

  return (
    <div className="lightbox-overlay active" onClick={onClose} style={{ opacity: 1, visibility: "visible" }}>
      <div className="lightbox-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
        <div className="catalogue-lightbox-card">
          <div className="catalogue-lightbox-header">
            <h3>{product.name}</h3>
            <div className="catalogue-lightbox-header-right">
              {product.category?.name && <span className="category-pill-badge">{product.category.name}</span>}
              <button type="button" className="catalogue-lightbox-close" onClick={onClose} aria-label="Close preview">
                <X size={18} weight="bold" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="catalogue-lightbox-main-img">
            {hasMultiple && (
              <button type="button" className="catalogue-lightbox-nav catalogue-lightbox-nav-prev" onClick={goPrev} aria-label="Previous image">
                <CaretLeft size={22} weight="bold" aria-hidden="true" />
              </button>
            )}
            {currentUrl ? (
              <FallbackImage src={currentUrl} alt={product.name} width={500} height={500} className="lightbox-image" />
            ) : (
              <div className="product-img-placeholder" style={{ width: 250, height: 250 }} />
            )}
            {hasMultiple && (
              <button type="button" className="catalogue-lightbox-nav catalogue-lightbox-nav-next" onClick={goNext} aria-label="Next image">
                <CaretRight size={22} weight="bold" aria-hidden="true" />
              </button>
            )}
          </div>
          {hasMultiple && (
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
      <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        <CaretLeft size={14} weight="bold" aria-hidden="true" />
        Prev
      </button>
      <span className="pagination-text">Page {page} of {totalPages}</span>
      <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        Next
        <CaretRight size={14} weight="bold" aria-hidden="true" />
      </button>
    </div>
  );
}

function CatalogueCardsSkeleton() {
  return (
    <div className="admin-catalogue-cards" aria-hidden="true">
      {Array.from({ length: 4 }, (_, idx) => (
        <div key={idx} className="catalogue-card">
          <div className="catalogue-card-thumb">
            <div className="skeleton-text" style={{ width: 72, height: 72 }} />
          </div>
          <div className="catalogue-card-body">
            <div className="skeleton-text" style={{ width: "60%", height: 14 }} />
            <div className="skeleton-text" style={{ width: "40%", height: 12, marginTop: 8 }} />
            <div className="skeleton-text" style={{ width: "30%", height: 12, marginTop: 14 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function CatalogueCards({
  products,
  loading,
  loadingProductId,
  onPreviewImages,
  onEdit,
  onRequestDelete,
}: {
  products: Product[];
  loading: boolean;
  loadingProductId: string | null;
  onPreviewImages: (product: Product) => void;
  onEdit: (product: Product) => void;
  onRequestDelete: (product: Product) => void;
}) {
  if (loading) return <CatalogueCardsSkeleton />;

  if (products.length === 0) {
    return (
      <div className="admin-catalogue-cards">
        <p className="empty-state">No products match your filters.</p>
      </div>
    );
  }

  return (
    <ul className="admin-catalogue-cards">
      {products.map((product) => {
        const primaryImage =
          product.images?.find((img) => img.isPrimary)?.url || product.imageUrl;
        const hasValidImage = !!primaryImage && /^https?:\/\//.test(primaryImage);
        const imageCount = product.images?.length || (product.imageUrl ? 1 : 0);
        const priceNum = Number(product.price) || 0;
        const compareNum = Number(product.compareAtPrice) || 0;
        const hasDiscount = compareNum > priceNum;
        const savingsPercent = hasDiscount
          ? Math.round(((compareNum - priceNum) / compareNum) * 100)
          : 0;
        const qty = product.stockQuantity;
        const isDeleting = loadingProductId === product.id;

        return (
          <li key={product.id} className="catalogue-card">
            <button
              type="button"
              className="catalogue-card-thumb"
              onClick={() => onPreviewImages(product)}
              aria-label={`View gallery for ${product.name}`}
              title="Click to preview gallery images"
            >
              {hasValidImage ? (
                <FallbackImage
                  src={primaryImage}
                  alt=""
                  width={72}
                  height={72}
                  className="catalogue-card-thumb-img"
                />
              ) : (
                <div className="product-img-placeholder" style={{ width: 56, height: 72 }} />
              )}
              {imageCount > 0 && (
                <span className="catalogue-card-gallery-count">
                  <Images size={12} weight="bold" aria-hidden="true" />
                  {imageCount}
                </span>
              )}
            </button>
            <div className="catalogue-card-body">
              <div className="catalogue-card-head">
                <div className="catalogue-card-title">
                  <strong className="catalogue-card-name">{product.name}</strong>
                  {product.sku && <code className="sku-code">{product.sku}</code>}
                </div>
                <div className="catalogue-card-badges">
                  {product.category?.name && (
                    <span className="category-pill-badge">{product.category.name}</span>
                  )}
                  {product.badge && (
                    <span className={`luxury-badge badge-${product.badge.toLowerCase()}`}>
                      {product.badge}
                    </span>
                  )}
                </div>
              </div>
              <div className="catalogue-card-meta">
                <div className="table-price-cell">
                  <div className="price-primary">₹{formatINR(priceNum)}</div>
                  {hasDiscount && (
                    <div className="price-secondary">
                      <span className="price-mrp">₹{formatINR(compareNum)}</span>
                      <span className="discount-badge">-{savingsPercent}%</span>
                    </div>
                  )}
                </div>
                <span
                  className={`stock-health-badge ${qty <= 0 ? "out-of-stock" : qty <= 3 ? "low-stock" : "in-stock"}`}
                >
                  <span className="stock-dot" />
                  {qty <= 0 ? "Out of stock" : qty <= 3 ? `Low (${qty})` : `${qty} in stock`}
                </span>
              </div>
              <div className="catalogue-card-actions">
                <button
                  type="button"
                  className="btn btn-secondary product-action-btn btn-sm"
                  onClick={() => onEdit(product)}
                  disabled={isDeleting}
                >
                  <PencilSimple size={15} weight="bold" aria-hidden="true" />
                  Edit
                </button>
                <button
                  type="button"
                  className={`btn btn-danger product-action-btn btn-sm ${isDeleting ? "loading" : ""}`}
                  onClick={() => onRequestDelete(product)}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <span className="btn-spinner" aria-hidden="true" />
                  ) : (
                    <Trash size={15} weight="bold" aria-hidden="true" />
                  )}
                  Delete
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
