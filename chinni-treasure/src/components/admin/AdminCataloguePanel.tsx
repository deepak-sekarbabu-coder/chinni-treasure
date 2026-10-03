"use client";

import FallbackImage from "@/src/components/ui/FallbackImage";
import { formatINR } from "@/src/lib/format";
import { primaryImage, productDisplayView, isDisplayableImageUrl, imageUrls } from "@/src/lib/product-display";
import { StockHealthCell, BadgeCell } from "@/src/components/admin/table/columns.catalogue";
import { Images, PencilSimple, Trash, X } from "@phosphor-icons/react";
import { useCallback, useMemo, useState } from "react";
import { type SortingState, type OnChangeFn } from "@tanstack/react-table";
import AdminDataTable from "@/src/components/admin/table/AdminDataTable";
import { AdminCardList, AdminPaginationBar, useAdminListTable } from "@/src/components/admin/table/AdminList";
import { CardSkeletonLines } from "@/src/components/admin/table/CardSkeleton";
import {
  apiSortToSorting,
  sortingToApiSort,
  createCatalogueColumns,
} from "@/src/components/admin/table/columns.catalogue";
import { SORT_KEYS, SORT_LABELS } from "@/src/lib/sort-contract";
import { PRODUCT_BADGE_OPTIONS } from "@/src/lib/constants";
import type { Product } from "@/src/lib/api/schemas";
import type { ProductFilters, CataloguePanelViewModel } from "@/src/components/admin/useAdminCataloguePanel";
import ProductFormModal from "@/src/components/admin/ProductFormModal";
import ImageLightbox from "@/src/components/ui/ImageLightbox";

/**
 * Takes the panel view-model whole. It used to take 21 named props that
 * `app/admin/page.tsx` unpacked from that same view-model by hand — the page
 * restated the interface, and one field (`categoriesLoading`) was a hardcoded
 * `false` that the panel never even read.
 */
export default function AdminCataloguePanel({ panel }: { panel: CataloguePanelViewModel }) {
  const {
    showForm,
    formClosing,
    productForm,
    products,
    loadingProductId,
    currentPage: productPage,
    productTotalPages,
    categories,
    categoriesLoading,
    filters,
  } = panel.data;
  const { loading: productsLoading, formSaving: productLoading } = panel;
  const {
    onFilterChange,
    onFilterReset,
    onToggleForm,
    onFormChange,
    onSave,
    onEdit,
    onRequestDelete,
    onPageChange,
  } = panel.actions;
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

  const table = useAdminListTable({
    data: products,
    columns,
    sorting,
    onSortingChange: handleSortingChange,
    pagination: { pageIndex: productPage - 1, pageSize: 5 },
    pageCount: productTotalPages,
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

      <ProductFormModal open={showForm} formClosing={formClosing} productForm={productForm} productLoading={productLoading} categories={categories} categoriesLoading={categoriesLoading} onFormChange={onFormChange} onSave={onSave} onClose={onToggleForm} />

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
            {PRODUCT_BADGE_OPTIONS.map((b) => (
              <option key={b.value} value={b.value}>{b.label}</option>
            ))}
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
            {SORT_KEYS.map((key) => (
              <option key={key} value={key}>
                {SORT_LABELS[key]}
              </option>
            ))}
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

      <AdminCardList
        as="ul"
        className="admin-catalogue-cards"
        loading={productsLoading}
        isEmpty={products.length === 0}
        empty={<p className="empty-state">No products match your filters.</p>}
        skeletonCount={4}
        renderSkeleton={catalogueCardSkeleton}
      >
        {products.map((product) => {
          // Shared display contract: primary-image pick + discount math + stock state.
          const view = productDisplayView(product);
          const image = primaryImage(product);
          const hasValidImage = isDisplayableImageUrl(image);
          const imageCount = product.images?.length || (product.imageUrl ? 1 : 0);
          const isDeleting = loadingProductId === product.id;

          return (
            <li key={product.id} className="catalogue-card">
              <button
                type="button"
                className="catalogue-card-thumb"
                onClick={() => setLightboxProduct(product)}
                aria-label={`View gallery for ${product.name}`}
                title="Click to preview gallery images"
              >
                {hasValidImage ? (
                  <FallbackImage
                    src={image}
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
                    {view.badge && <BadgeCell badge={view.badge} />}
                  </div>
                </div>
                <div className="catalogue-card-meta">
                  <div className="table-price-cell">
                    <div className="price-primary">₹{formatINR(view.price)}</div>
                    {view.hasDiscount && view.compareAtPrice != null && (
                      <div className="price-secondary">
                        <span className="price-mrp">₹{formatINR(view.compareAtPrice)}</span>
                        <span className="discount-badge">-{view.discountPercent}%</span>
                      </div>
                    )}
                  </div>
                  <StockHealthCell qty={product.stockQuantity} />
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
      </AdminCardList>

      <AdminPaginationBar page={productPage} totalPages={productTotalPages} onPageChange={onPageChange} />

      {/* Table Image Gallery Lightbox — the shared core; the display module
          picked the image list via imageUrls(), the viewer owns the viewing. */}
      {lightboxProduct && (
        <ImageLightbox
          images={imageUrls(lightboxProduct)}
          alt={lightboxProduct.name}
          onClose={() => setLightboxProduct(null)}
        />
      )}
    </div>
  );
}

/** The mobile card placeholder, drawn by the shared AdminCardList frame. */
function catalogueCardSkeleton() {
  return (
    <li className="catalogue-card" aria-hidden="true">
      <div className="catalogue-card-thumb">
        <div className="skeleton-text" style={{ width: 72, height: 72 }} />
      </div>
      <div className="catalogue-card-body">
        <CardSkeletonLines />
      </div>
    </li>
  );
}


