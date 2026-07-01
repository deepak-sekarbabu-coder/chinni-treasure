"use client";

import { useCallback, useState } from "react";
import { useToast } from "@/src/components/ui/ToastProvider";
import {
  useCreateProduct,
  useDeleteProduct,
  useUpdateProduct,
} from "@/src/lib/hooks/useAdminMutations";
import { extractApiErrorMessage } from "@/src/lib/utils";
import type { Product } from "@/src/lib/api/schemas";

interface ProductFormState {
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
  images: Array<{ url: string; isPrimary: boolean; displayOrder: number }>;
}

const EMPTY_PRODUCT_FORM: ProductFormState = {
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
  images: [],
};

interface DeleteConfirmState {
  open: boolean;
  productId: string;
  productName: string;
}

const CLOSED_DELETE: DeleteConfirmState = {
  open: false,
  productId: "",
  productName: "",
};

const FORM_CLOSE_ANIMATION_MS = 300;

function productToFormState(product: Product): ProductFormState {
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
    images: (product.images || []).map((img) => ({
      url: img.url,
      isPrimary: img.isPrimary,
      displayOrder: img.displayOrder,
    })),
  };
}

export function useAdminCatalogueController(options?: { onAfterSave?: () => void }) {
  const { showToast } = useToast();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const onAfterSave = options?.onAfterSave;

  const [showProductForm, setShowProductForm] = useState(false);
  const [productFormClosing, setProductFormClosing] = useState(false);
  const [productForm, setProductForm] = useState<ProductFormState>(EMPTY_PRODUCT_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>(CLOSED_DELETE);

  const closeProductForm = useCallback(() => {
    setProductFormClosing(true);
    setTimeout(() => {
      setShowProductForm(false);
      setProductFormClosing(false);
      setProductForm(EMPTY_PRODUCT_FORM);
    }, FORM_CLOSE_ANIMATION_MS);
  }, []);

  const toggleProductForm = useCallback(() => {
    if (showProductForm) {
      closeProductForm();
    } else {
      setProductForm(EMPTY_PRODUCT_FORM);
      setShowProductForm(true);
    }
  }, [showProductForm, closeProductForm]);

  const editProduct = useCallback((product: Product) => {
    setProductFormClosing(false);
    setProductForm(productToFormState(product));
    setShowProductForm(true);
  }, []);
  const requestProductDelete = useCallback((product: Product) => {
    setDeleteConfirm({ open: true, productId: product.id, productName: product.name });
  }, []);

  const closeDeleteConfirm = useCallback(() => {
    setDeleteConfirm(CLOSED_DELETE);
  }, []);

  const handleProductSave = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const isEdit = !!productForm.id;
      const price = parseFloat(productForm.price);
      if (!productForm.name.trim() || Number.isNaN(price) || price <= 0) {
        showToast("Product name and a valid price are required", "error");
        return;
      }
      const stockQuantity = parseInt(productForm.stockQuantity) || 0;
      const compareAtPrice = productForm.compareAtPrice ? parseFloat(productForm.compareAtPrice) : null;
      const payload = {
        name: productForm.name.trim(),
        sku: productForm.sku.trim() || undefined,
        description: productForm.description,
        price,
        compareAtPrice: compareAtPrice && compareAtPrice > 0 ? compareAtPrice : null,
        stockQuantity,
        imageUrl: productForm.imageUrl || undefined,
        badge: productForm.badge || null,
        categoryId: productForm.categoryId ? parseInt(productForm.categoryId) : null,
        images: productForm.images.length > 0
          ? productForm.images.map((img) => ({
            url: img.url,
            isPrimary: img.isPrimary,
            displayOrder: img.displayOrder,
          }))
          : undefined,
      };
      try {
        if (isEdit) {
          await updateProduct.mutateAsync({ productId: productForm.id, input: payload });
          showToast(`Product "${productForm.name}" updated successfully`, "success");
        } else {
          await createProduct.mutateAsync(payload);
          showToast(`Product "${productForm.name}" created successfully`, "success");
        }
        onAfterSave?.();
        closeProductForm();
      } catch (err) {
        console.error("Failed to save product:", err);
        showToast(extractApiErrorMessage(err, "Failed to save product"), "error");
      }
    },
    [productForm, createProduct, updateProduct, showToast, closeProductForm, onAfterSave],
  );

  const handleProductDeleteConfirmed = useCallback(async () => {
    if (!deleteConfirm.productId) return;
    try {
      await deleteProduct.mutateAsync(deleteConfirm.productId);
      showToast("Product deleted successfully", "success");
      setDeleteConfirm(CLOSED_DELETE);
    } catch (err) {
      console.error("Failed to delete product:", err);
      showToast(extractApiErrorMessage(err, "Failed to delete product"), "error");
    }
  }, [deleteConfirm.productId, deleteProduct, showToast]);

  const onFormChange = useCallback((next: ProductFormState) => {
    setProductForm(next);
  }, []);

  return {
    showProductForm,
    productFormClosing,
    productForm,
    deleteConfirm,
    productLoading: createProduct.isPending || updateProduct.isPending,
    loadingProductId: deleteProduct.isPending ? deleteConfirm.productId : null,
    isDeleting: deleteProduct.isPending,
    toggleProductForm,
    editProduct,
    requestProductDelete,
    closeDeleteConfirm,
    handleProductSave,
    handleProductDeleteConfirmed,
    onFormChange,
  };
}
