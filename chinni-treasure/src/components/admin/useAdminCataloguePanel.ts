"use client";

import { useCallback, useMemo, useState } from "react";
import { ADMIN_PAGE_SIZES, useAdminCategories, useAdminProducts } from "@/src/lib/hooks/useAdminData";
import { useAdminCatalogueController } from "@/src/lib/hooks/useAdminCatalogueController";
import type { Category, Product } from "@/src/lib/api/schemas";
import type { ProductFormData } from "@/src/types";

export interface ProductFilters {
  search: string;
  categoryId: number | "";
  badge: string;
  status: "all" | "active" | "inactive";
  sort: string;
}

const DEFAULT_FILTERS: ProductFilters = { search: "", categoryId: "", badge: "all", status: "all", sort: "newest" };

/**
 * Catalogue panel-view module.
 *
 * Owns the products query (lazy-enabled on the catalogue tab), the category
 * list the product form needs, filters, pagination, and the product form /
 * delete-confirm controller — behind one typed view-model.
 */
export interface CataloguePanelData {
  products: Product[];
  productTotalPages: number;
  categories: Category[];
  filters: ProductFilters;
  currentPage: number;
  showForm: boolean;
  formClosing: boolean;
  productForm: ProductFormData;
  deleteConfirm: { open: boolean; productId: string; productName: string };
  loadingProductId: string | null;
}

export interface CataloguePanelActions {
  onPageChange: (page: number) => void;
  onFilterChange: (updates: Partial<ProductFilters>) => void;
  onFilterReset: () => void;
  onToggleForm: () => void;
  onFormChange: (form: ProductFormData) => void;
  onSave: (e: React.FormEvent) => Promise<void>;
  onEdit: (product: Product) => void;
  onRequestDelete: (product: Product) => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => Promise<void>;
}

export interface CataloguePanelViewModel {
  data: CataloguePanelData;
  loading: boolean;
  formSaving: boolean;
  isDeleting: boolean;
  actions: CataloguePanelActions;
}

interface UseAdminCataloguePanelArgs {
  authenticated: boolean;
  enabled: boolean;
}

export function useAdminCataloguePanel({
  authenticated,
  enabled,
}: UseAdminCataloguePanelArgs): CataloguePanelViewModel {
  const [productFilters, setProductFilters] = useState<ProductFilters>(DEFAULT_FILTERS);
  const [productPage, setProductPage] = useState(1);

  const productsQuery = useAdminProducts(
    {
      page: productPage,
      limit: ADMIN_PAGE_SIZES.products,
      isActive: productFilters.status,
      search: productFilters.search || undefined,
      categoryId: typeof productFilters.categoryId === "number" ? productFilters.categoryId : undefined,
      badge: productFilters.badge !== "all" ? productFilters.badge : undefined,
      sort: productFilters.sort,
    },
    authenticated && enabled,
  );

  const categoriesQuery = useAdminCategories(authenticated, true);

  const products = useMemo(() => productsQuery.data?.products ?? [], [productsQuery.data?.products]);
  const productTotalPages = productsQuery.data?.totalPages ?? 1;

  const controller = useAdminCatalogueController({
    // New products prepend to the list, so after a create go back to page 1
    // to make it visible.
    onAfterSave: (wasCreate) => {
      if (wasCreate) setProductPage(1);
    },
  });

  const handleFilterChange = useCallback((updates: Partial<ProductFilters>) => {
    setProductFilters((prev) => ({ ...prev, ...updates }));
    setProductPage(1);
  }, []);

  const handleFilterReset = useCallback(() => {
    setProductFilters(DEFAULT_FILTERS);
    setProductPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setProductPage(page);
  }, []);

  return {
    data: {
      products,
      productTotalPages,
      categories: categoriesQuery.data ?? [],
      filters: productFilters,
      currentPage: productPage,
      showForm: controller.showProductForm,
      formClosing: controller.productFormClosing,
      productForm: controller.productForm,
      deleteConfirm: controller.deleteConfirm,
      loadingProductId: controller.loadingProductId,
    },
    loading: productsQuery.isLoading || productsQuery.isFetching,
    formSaving: controller.productLoading,
    isDeleting: controller.isDeleting,
    actions: {
      onPageChange: handlePageChange,
      onFilterChange: handleFilterChange,
      onFilterReset: handleFilterReset,
      onToggleForm: controller.toggleProductForm,
      onFormChange: controller.onFormChange,
      onSave: controller.handleProductSave,
      onEdit: controller.editProduct,
      onRequestDelete: controller.requestProductDelete,
      onCancelDelete: controller.closeDeleteConfirm,
      onConfirmDelete: controller.handleProductDeleteConfirmed,
    },
  };
}
