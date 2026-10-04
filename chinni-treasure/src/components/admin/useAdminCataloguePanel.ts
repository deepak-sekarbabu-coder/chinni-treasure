"use client";

import { useCallback, useMemo, useState } from "react";
import { ADMIN_PAGE_SIZES, useAdminCategories, useAdminProducts } from "@/src/lib/hooks/useAdminData";
import {
  useCreateProduct,
  useDeleteProduct,
  useUpdateProduct,
} from "@/src/lib/hooks/useAdminMutations";
import { useAdminCrud } from "@/src/lib/hooks/useAdminCrud";
import {
  EMPTY_PRODUCT_DRAFT,
  draftFromProduct,
  productDraftPayload,
  validateProductDraft,
} from "@/src/lib/product-draft";
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
 * delete-confirm state — behind one typed view-model.
 *
 * The CRUD config lives here rather than in a separate controller: it was a
 * pure rename band over `useAdminCrud`, which is the actual seam.
 */
export interface CataloguePanelData {
  products: Product[];
  productTotalPages: number;
  categories: Category[];
  categoriesLoading: boolean;
  filters: ProductFilters;
  currentPage: number;
  showForm: boolean;
  formClosing: boolean;
  productForm: ProductFormData;
  deleteConfirm: { open: boolean; productId: string; productName: string };
  loadingProductId: string | null;
}

/** The CRUD module's own return type, so the panel's actions are derived from
 *  it rather than re-declared: a renamed or dropped `useAdminCrud` action
 *  becomes a type error here instead of a panel calling `undefined`. */
type CatalogueCrud = ReturnType<
  typeof useAdminCrud<
    Product,
    ProductFormData,
    { open: boolean; productId: string; productName: string },
    string,
    Parameters<ReturnType<typeof useCreateProduct>["mutateAsync"]>[0]
  >
>;

export interface CataloguePanelActions {
  onPageChange: (page: number) => void;
  onFilterChange: (updates: Partial<ProductFilters>) => void;
  onFilterReset: () => void;
  onToggleForm: CatalogueCrud["toggleForm"];
  onFormChange: CatalogueCrud["onFormChange"];
  onSave: CatalogueCrud["save"];
  onEdit: CatalogueCrud["edit"];
  onRequestDelete: CatalogueCrud["requestDelete"];
  onCancelDelete: CatalogueCrud["closeDeleteConfirm"];
  onConfirmDelete: CatalogueCrud["confirmDelete"];
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

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const crud = useAdminCrud<
    Product,
    ProductFormData,
    { open: boolean; productId: string; productName: string },
    string,
    Parameters<typeof createProduct.mutateAsync>[0]
  >({
    emptyForm: EMPTY_PRODUCT_DRAFT,
    emptyDeleteState: { open: false, productId: "", productName: "" },
    toFormState: draftFromProduct,
    toDeleteState: (product: Product) => ({
      open: true,
      productId: product.id,
      productName: product.name,
    }),
    deleteId: (state) => state.productId || null,
    validate: validateProductDraft,
    buildPayload: productDraftPayload,
    save: async (form, payload, isEdit) => {
      if (isEdit) {
        await updateProduct.mutateAsync({ productId: form.id, input: payload });
      } else {
        await createProduct.mutateAsync(payload);
      }
    },
    remove: (id) => deleteProduct.mutateAsync(id),
    saving: createProduct.isPending || updateProduct.isPending,
    deleting: deleteProduct.isPending,
    createdToast: (form) => `Product "${form.name}" created successfully`,
    updatedToast: (form) => `Product "${form.name}" updated successfully`,
    deletedToast: "Product deleted successfully",
    saveErrorFallback: "Failed to save product",
    deleteErrorFallback: "Failed to delete product",
    // New products prepend to the list, so after a create go back to page 1
    // to make it visible.
    onSaved: (wasCreate) => {
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
      categoriesLoading: categoriesQuery.isLoading,
      filters: productFilters,
      currentPage: productPage,
      showForm: crud.showForm,
      formClosing: crud.formClosing,
      productForm: crud.form,
      deleteConfirm: crud.deleteConfirm,
      loadingProductId: crud.deletingId,
    },
    loading: productsQuery.isLoading || productsQuery.isFetching,
    formSaving: crud.formSaving,
    isDeleting: crud.deleting,
    actions: {
      onPageChange: handlePageChange,
      onFilterChange: handleFilterChange,
      onFilterReset: handleFilterReset,
      onToggleForm: crud.toggleForm,
      onFormChange: crud.onFormChange,
      onSave: crud.save,
      onEdit: crud.edit,
      onRequestDelete: crud.requestDelete,
      onCancelDelete: crud.closeDeleteConfirm,
      onConfirmDelete: crud.confirmDelete,
    },
  };
}