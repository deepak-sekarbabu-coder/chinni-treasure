"use client";

import {
  useCreateProduct,
  useDeleteProduct,
  useUpdateProduct,
} from "@/src/lib/hooks/useAdminMutations";
import { useAdminCrud } from "@/src/lib/hooks/useAdminCrud";
import type { ProductFormData } from "@/src/types";
import type { Product } from "@/src/lib/api/schemas";

export type { ProductFormData };

/**
 * Catalogue policy over the shared admin-CRUD seam: everything entity-specific
 * (form mapping, validation, payload, mutations, toast copy) lives here; the
 * state machine and save/delete choreography live in useAdminCrud.
 */
export function useAdminCatalogueController(options?: {
  onAfterSave?: (wasCreate: boolean) => void;
}) {
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const onAfterSave = options?.onAfterSave;

  return useAdminCrud<Product, ProductFormData, { open: boolean; productId: string; productName: string }, string, Parameters<typeof createProduct.mutateAsync>[0]>({
    emptyForm: {
      id: "",
      name: "",
      sku: "",
      description: "",
      price: "",
      compareAtPrice: "",
      stockQuantity: "",
      imageUrl: "",
      badge: "",
      categoryId: "",
      isActive: true,
      allowGiftBoxBundling: false,
        visibleHostnames: "",
      images: [],
    },
    emptyDeleteState: { open: false, productId: "", productName: "" },
    toFormState: productToFormState,
    toDeleteState: (product: Product) => ({
      open: true,
      productId: product.id,
      productName: product.name,
    }),
    deleteId: (state) => state.productId || null,
    validate: (form) =>
      !form.name.trim()
        ? "Product name and a valid price are required"
        : Number.isNaN(parseFloat(form.price)) || parseFloat(form.price) <= 0
          ? "Product name and a valid price is required"
          : null,
    buildPayload: (form) => {
      const price = parseFloat(form.price);
      const compareAtPrice = form.compareAtPrice ? parseFloat(form.compareAtPrice) : null;
      return {
        name: form.name.trim(),
        sku: form.sku.trim() || undefined,
        description: form.description,
        price,
        compareAtPrice: compareAtPrice && compareAtPrice > 0 ? compareAtPrice : null,
        stockQuantity: parseInt(form.stockQuantity) || 0,
        imageUrl: form.imageUrl || undefined,
        badge: form.badge || null,
        categoryId: form.categoryId ? parseInt(form.categoryId) : null,
        isActive: form.isActive,
        allowGiftBoxBundling: form.allowGiftBoxBundling,
        visibleHostnames: form.visibleHostnames || undefined,
        images:
          form.images.length > 0
            ? form.images.map((img) => ({
                url: img.url,
                isPrimary: img.isPrimary,
                displayOrder: img.displayOrder,
              }))
            : undefined,
      };
    },
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
    updatedToast: (form) => `Product \"${form.name}\" updated successfully`,
    deletedToast: "Product deleted successfully",
    saveErrorFallback: "Failed to save product",
    deleteErrorFallback: "Failed to delete product",
    onSaved: onAfterSave,
  });
}

function productToFormState(product: Product): ProductFormData {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku || "",
    description: product.description || "",
    price: product.price.toString(),
    compareAtPrice: product.compareAtPrice?.toString() ?? "",
    stockQuantity: product.stockQuantity.toString(),
    imageUrl: product.imageUrl || "",
    badge: product.badge || "",
    categoryId: product.categoryId ? product.categoryId.toString() : "",
    isActive: product.isActive,
    allowGiftBoxBundling: product.allowGiftBoxBundling ?? false,
    visibleHostnames: product.visibleHostnames || "",
    images: (product.images || []).map((img) => ({
      url: img.url,
      isPrimary: img.isPrimary,
      displayOrder: img.displayOrder,
    })),
  };
}
