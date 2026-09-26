"use client";

import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { Images, MagnifyingGlassPlus, PencilSimple, Trash } from "@phosphor-icons/react";
import FallbackImage from "@/src/components/ui/FallbackImage";
import type { Product } from "@/src/lib/api/schemas";
import { formatINR } from "@/src/lib/format";
import { primaryImage, productDisplayView, stockHealth } from "@/src/lib/product-display";

export interface CatalogueTableMeta {
  loadingProductId: string | null;
  onPreviewImages: (product: Product) => void;
  onEdit: (product: Product) => void;
  onRequestDelete: (product: Product) => void;
}

const COLUMN_API_SORTS = {
  name: { asc: "name-asc", desc: "name-desc" },
  price: { asc: "price-asc", desc: "price-desc" },
  stockQuantity: { asc: "stock-asc", desc: "stock-desc" },
  sku: { asc: "sku-asc", desc: "sku-desc" },
  createdAt: { asc: "oldest", desc: "newest" },
} as const;

export function apiSortToSorting(apiSort: string): SortingState {
  if (apiSort === "newest") return [];
  for (const [id, pair] of Object.entries(COLUMN_API_SORTS)) {
    if (pair.asc === apiSort) return [{ id, desc: false }];
    if (pair.desc === apiSort) return [{ id, desc: true }];
  }
  return [];
}

export function sortingToApiSort(sorting: SortingState): string {
  const head = sorting[0];
  if (!head) return "newest";
  const pair = COLUMN_API_SORTS[head.id as keyof typeof COLUMN_API_SORTS];
  return pair ? (head.desc ? pair.desc : pair.asc) : "newest";
}

export function StockHealthCell({ qty }: { qty: number }) {
  const state = stockHealth(qty);
  const className =
    state === "out" ? "out-of-stock" : state === "low" ? "low-stock" : "in-stock";
  return (
    <span className={`stock-health-badge ${className}`}>
      <span className="stock-dot" />
      {state === "out" ? "Out of stock" : state === "low" ? `Low (${qty})` : `${qty} in stock`}
    </span>
  );
}

export function BadgeCell({ badge }: { badge: string | null | undefined }) {
  if (!badge) return <span className="text-muted text-xs">—</span>;
  return <span className={`luxury-badge badge-${badge.toLowerCase()}`}>{badge}</span>;
}

function GalleryThumbCell({
  product,
  onPreview,
}: {
  product: Product;
  onPreview: (p: Product) => void;
}) {
  // Shared display contract: primary-image pick. Null and load failure both
  // resolve to the shared placeholder inside FallbackImage.
  const image = primaryImage(product);
  return (
    <div
      className="table-img-wrapper"
      onClick={() => onPreview(product)}
      title="Click to view full image gallery"
    >
      <FallbackImage
        src={image}
        alt={product.name}
        width={52}
        height={52}
        className="product-table-img"
      />
      <div className="table-img-zoom-hint">
        <MagnifyingGlassPlus size={13} weight="bold" aria-hidden="true" />
      </div>
    </div>
  );
}

export function createCatalogueColumns(meta: CatalogueTableMeta): ColumnDef<Product>[] {
  const { loadingProductId, onPreviewImages, onEdit, onRequestDelete } = meta;
  return [
    {
      id: "image",
      header: "Image",
      enableSorting: false,
      cell: ({ row }) => <GalleryThumbCell product={row.original} onPreview={onPreviewImages} />,
    },
    {
      id: "name",
      accessorKey: "name",
      header: "Name",
      meta: { label: "Name" },
      cell: ({ row }) => <span className="fw-500">{row.original.name}</span>,
    },
    {
      id: "category",
      header: "Category",
      enableSorting: false,
      cell: ({ row }) =>
        row.original.category?.name ? (
          <span className="category-pill-badge">{row.original.category.name}</span>
        ) : (
          <span className="text-muted text-xs">—</span>
        ),
    },
    {
      id: "sku",
      accessorFn: (p) => p.sku ?? "",
      header: "Code",
      meta: { label: "Code" },
      cell: ({ row }) =>
        row.original.sku ? (
          <code className="sku-code">{row.original.sku}</code>
        ) : (
          <span className="text-xs text-muted">—</span>
        ),
    },
    {
      id: "price",
      accessorFn: (p) => Number(p.price) || 0,
      header: "Price & MRP",
      meta: { label: "Price" },
      cell: ({ row }) => {
        const view = productDisplayView(row.original);
        return (
          <div className="table-price-cell">
            <div className="price-primary">₹{formatINR(view.price)}</div>
            {view.hasDiscount && view.compareAtPrice != null && (
              <div className="price-secondary">
                <span className="price-mrp">₹{formatINR(view.compareAtPrice)}</span>
                <span className="discount-badge">-{view.discountPercent}%</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: "stockQuantity",
      accessorKey: "stockQuantity",
      header: "Stock",
      meta: { label: "Stock" },
      cell: ({ row }) => <StockHealthCell qty={row.original.stockQuantity} />,
    },
    {
      id: "badge",
      header: "Badge",
      enableSorting: false,
      cell: ({ row }) => <BadgeCell badge={row.original.badge} />,
    },
    {
      id: "bundling",
      header: "Bundling",
      enableSorting: false,
      cell: ({ row }) =>
        row.original.allowGiftBoxBundling ? (
          <span className="table-status-pill active">
            <span className="status-dot" />
            Enabled
          </span>
        ) : (
          <span className="text-muted text-xs">—</span>
        ),
    },
    {
      id: "gallery",
      header: "Gallery",
      enableSorting: false,
      cell: ({ row }) => {
        const product = row.original;
        const imageCount = product.images?.length || (product.imageUrl ? 1 : 0);
        return (
          <button
            type="button"
            className="image-count-pill"
            onClick={() => onPreviewImages(product)}
            title="Click to preview gallery images"
          >
            <Images size={13} weight="bold" aria-hidden="true" />
            {imageCount}
          </button>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => (
        <span className={`table-status-pill ${row.original.isActive ? "active" : "inactive"}`}>
          <span className="status-dot" />
          {row.original.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      id: "createdAt",
      accessorFn: (p) => new Date(p.createdAt).getTime(),
      header: "Created",
      meta: { label: "Created" },
      cell: ({ row }) => (
        <time dateTime={String(row.original.createdAt)}>
          {new Date(row.original.createdAt).toLocaleDateString("en-IN")}
        </time>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => {
        const product = row.original;
        const isDeleting = loadingProductId === product.id;
        return (
          <div className="table-actions">
            <button
              type="button"
              className="btn btn-secondary product-action-btn icon-btn"
              onClick={() => onEdit(product)}
              disabled={isDeleting}
              title="Edit product"
              aria-label={`Edit ${product.name}`}
            >
              <PencilSimple size={15} weight="bold" aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`btn btn-danger product-action-btn icon-btn ${isDeleting ? "loading" : ""}`}
              onClick={() => onRequestDelete(product)}
              disabled={isDeleting}
              title="Delete product"
              aria-label={`Delete ${product.name}`}
            >
              {isDeleting ? (
                <span className="btn-spinner" aria-hidden="true" />
              ) : (
                <Trash size={15} weight="bold" aria-hidden="true" />
              )}
            </button>
          </div>
        );
      },
    },
  ];
}
