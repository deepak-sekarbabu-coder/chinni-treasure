"use client";

import { useCallback } from "react";
import { useToast } from "@/src/components/ui/ToastProvider";
import {
  useCreateCategory,
  useDeleteCategory,
  useToggleCategoryActive,
  useUpdateCategory,
} from "@/src/lib/hooks/useAdminMutations";
import { useAdminCrud } from "@/src/lib/hooks/useAdminCrud";
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

/**
 * Categories policy over the shared admin-CRUD seam, plus the entity-specific
 * enable/disable toggle (catalogue has no equivalent).
 */
export function useAdminCategoriesController() {
  const { showToast } = useToast();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const toggleActive = useToggleCategoryActive();

  const crud = useAdminCrud<
    Category,
    CategoryFormState,
    DeleteConfirmState,
    number,
    Parameters<typeof createCategory.mutateAsync>[0]
  >({
    emptyForm: EMPTY_CATEGORY_FORM,
    emptyDeleteState: CLOSED_DELETE,
    toFormState: (category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description ?? "",
      displayOrder: String(category.displayOrder),
      isActive: category.isActive ?? false,
    }),
    toDeleteState: (category) => ({
      open: true,
      categoryId: category.id,
      categoryName: category.name,
      productCount: category.productCount ?? 0,
    }),
    deleteId: (state) => state.categoryId || null,
    validate: (form) => (!form.name.trim() ? "Category name is required" : null),
    buildPayload: (form) => ({
      name: form.name.trim(),
      slug: form.slug.trim() ? slugify(form.slug) : undefined,
      description: form.description.trim() || undefined,
      displayOrder: parseInt(form.displayOrder) || 0,
      isActive: form.isActive,
    }),
    save: async (form, payload, isEdit) => {
      if (isEdit) {
        await updateCategory.mutateAsync({ id: form.id!, input: payload });
      } else {
        await createCategory.mutateAsync(payload);
      }
    },
    remove: (id) => deleteCategory.mutateAsync(id),
    saving: createCategory.isPending || updateCategory.isPending,
    deleting: deleteCategory.isPending,
    createdToast: (form) => `Category \"${form.name}\" created successfully`,
    updatedToast: (form) => `Category \"${form.name}\" updated successfully`,
    deletedToast: "Category deleted successfully",
    saveErrorFallback: "Failed to save category",
    deleteErrorFallback: "Failed to delete category",
  });

  const handleToggleActive = useCallback(
    async (category: Category) => {
      try {
        await toggleActive.mutateAsync({
          id: category.id,
          isActive: !category.isActive,
        });
        showToast(
          `Category \"${category.name}\" ${category.isActive ? "disabled" : "enabled"}`,
          "success",
        );
      } catch (err) {
        console.error("Failed to toggle category:", err);
        showToast(extractApiErrorMessage(err, "Failed to update category"), "error");
      }
    },
    [toggleActive, showToast],
  );

  const togglePendingId = toggleActive.isPending
    ? ((toggleActive.variables as { id: number } | undefined)?.id ?? null)
    : null;

  return {
    ...crud,
    handleToggleActive,
    togglePendingId,
  };
}
