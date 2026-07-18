"use client";

import { useCallback, useState } from "react";
import { useToast } from "@/src/components/ui/ToastProvider";
import {
  useCreateCategory,
  useDeleteCategory,
  useToggleCategoryActive,
  useUpdateCategory,
} from "@/src/lib/hooks/useAdminMutations";
import { extractApiErrorMessage, slugify } from "@/src/lib/utils";
import type { Category } from "@/src/lib/api/schemas";

export interface CategoryFormState {
  id: number | null;
  name: string;
  slug: string;
  description: string;
  displayOrder: string;
  isActive: boolean;
}

const EMPTY_CATEGORY_FORM: CategoryFormState = {
  id: null,
  name: "",
  slug: "",
  description: "",
  displayOrder: "0",
  isActive: true,
};

const FORM_CLOSE_ANIMATION_MS = 300;

interface DeleteConfirmState {
  open: boolean;
  categoryId: number;
  categoryName: string;
  productCount: number;
}

const CLOSED_DELETE: DeleteConfirmState = {
  open: false,
  categoryId: 0,
  categoryName: "",
  productCount: 0,
};

export function useAdminCategoriesController() {
  const { showToast } = useToast();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const toggleActive = useToggleCategoryActive();

  const [showForm, setShowForm] = useState(false);
  const [formClosing, setFormClosing] = useState(false);
  const [form, setForm] = useState<CategoryFormState>(EMPTY_CATEGORY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>(CLOSED_DELETE);

  const closeForm = useCallback(() => {
    setFormClosing(true);
    setTimeout(() => {
      setShowForm(false);
      setFormClosing(false);
      setForm(EMPTY_CATEGORY_FORM);
    }, FORM_CLOSE_ANIMATION_MS);
  }, []);

  const toggleForm = useCallback(() => {
    if (showForm) {
      closeForm();
    } else {
      setForm(EMPTY_CATEGORY_FORM);
      setShowForm(true);
    }
  }, [showForm, closeForm]);

  const editCategory = useCallback((category: Category) => {
    setFormClosing(false);
    setForm({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description ?? "",
      displayOrder: String(category.displayOrder),
      isActive: category.isActive ?? false,
    });
    setShowForm(true);
  }, []);

  const requestDelete = useCallback(
    (category: Category & { productCount: number }) => {
      setDeleteConfirm({
        open: true,
        categoryId: category.id,
        categoryName: category.name,
        productCount: category.productCount,
      });
    },
    [],
  );

  const closeDeleteConfirm = useCallback(() => {
    setDeleteConfirm(CLOSED_DELETE);
  }, []);

  const handleSave = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const isEdit = form.id !== null;
      if (!form.name.trim()) {
        showToast("Category name is required", "error");
        return;
      }
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() ? slugify(form.slug) : undefined,
        description: form.description.trim() || undefined,
        displayOrder: parseInt(form.displayOrder) || 0,
        isActive: form.isActive,
      };
      try {
        if (isEdit) {
          await updateCategory.mutateAsync({ id: form.id!, input: payload });
          showToast(`Category "${form.name}" updated successfully`, "success");
        } else {
          await createCategory.mutateAsync(payload);
          showToast(`Category "${form.name}" created successfully`, "success");
        }
        closeForm();
      } catch (err) {
        console.error("Failed to save category:", err);
        showToast(extractApiErrorMessage(err, "Failed to save category"), "error");
      }
    },
    [form, createCategory, updateCategory, showToast, closeForm],
  );

  const handleDeleteConfirmed = useCallback(async () => {
    if (!deleteConfirm.categoryId) return;
    try {
      await deleteCategory.mutateAsync(deleteConfirm.categoryId);
      showToast("Category deleted successfully", "success");
      setDeleteConfirm(CLOSED_DELETE);
    } catch (err) {
      console.error("Failed to delete category:", err);
      showToast(extractApiErrorMessage(err, "Failed to delete category"), "error");
    }
  }, [deleteConfirm.categoryId, deleteCategory, showToast]);

  const handleToggleActive = useCallback(
    async (category: Category) => {
      try {
        await toggleActive.mutateAsync({
          id: category.id,
          isActive: !category.isActive,
        });
        showToast(
          `Category "${category.name}" ${category.isActive ? "disabled" : "enabled"}`,
          "success",
        );
      } catch (err) {
        console.error("Failed to toggle category:", err);
        showToast(extractApiErrorMessage(err, "Failed to update category"), "error");
      }
    },
    [toggleActive, showToast],
  );

  const onFormChange = useCallback((next: CategoryFormState) => {
    setForm(next);
  }, []);

  return {
    showForm,
    formClosing,
    form,
    deleteConfirm,
    productLoading: createCategory.isPending || updateCategory.isPending,
    loadingCategoryId: deleteCategory.isPending ? deleteConfirm.categoryId : null,
    isDeleting: deleteCategory.isPending,
    togglePendingId: toggleActive.isPending ? ((toggleActive.variables as { id: number } | undefined)?.id ?? null) : null,
    toggleForm,
    editCategory,
    requestDelete,
    closeDeleteConfirm,
    handleSave,
    handleDeleteConfirmed,
    handleToggleActive,
    onFormChange,
  };
}
