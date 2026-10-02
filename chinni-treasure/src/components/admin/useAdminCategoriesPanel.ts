"use client";

import { useCallback } from "react";
import { useAdminCategories } from "@/src/lib/hooks/useAdminData";
import {
  useCreateCategory,
  useDeleteCategory,
  useToggleCategoryActive,
  useUpdateCategory,
} from "@/src/lib/hooks/useAdminMutations";
import { useAdminCrud } from "@/src/lib/hooks/useAdminCrud";
import { useToast } from "@/src/components/ui/ToastProvider";
import { slugify } from "@/src/lib/utils";
import { getErrorMessage } from "@/src/lib/api/client";
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
 * Categories panel-view module.
 *
 * Owns the full category list (including inactive — admin management and the
 * product form both need it) and the category form / delete / toggle state,
 * behind one typed view-model. The CRUD config lives here rather than in a
 * separate controller: it was a pure rename band over `useAdminCrud`.
 */
export interface CategoriesPanelData {
  categories: Category[];
  showForm: boolean;
  formClosing: boolean;
  form: CategoryFormState;
  deleteConfirm: { open: boolean; categoryId: number; categoryName: string; productCount: number };
  loadingCategoryId: number | null;
  togglePendingId: number | null;
}

export interface CategoriesPanelActions {
  onToggleForm: () => void;
  onFormChange: (form: CategoryFormState) => void;
  onSave: (e: React.FormEvent) => Promise<void>;
  onEdit: (category: Category) => void;
  onRequestDelete: (category: Category & { productCount: number }) => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => Promise<void>;
  onToggleActive: (category: Category) => void;
}

export interface CategoriesPanelViewModel {
  data: CategoriesPanelData;
  loading: boolean;
  formSaving: boolean;
  actions: CategoriesPanelActions;
}

interface UseAdminCategoriesPanelArgs {
  authenticated: boolean;
}

export function useAdminCategoriesPanel({
  authenticated,
}: UseAdminCategoriesPanelArgs): CategoriesPanelViewModel {
  const { showToast } = useToast();
  const categoriesQuery = useAdminCategories(authenticated, true);
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
    createdToast: (form) => `Category "${form.name}" created successfully`,
    updatedToast: (form) => `Category "${form.name}" updated successfully`,
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
          `Category "${category.name}" ${category.isActive ? "disabled" : "enabled"}`,
          "success",
        );
      } catch (err) {
        console.error("Failed to toggle category:", err);
        showToast(getErrorMessage(err, "Failed to update category"), "error");
      }
    },
    [toggleActive, showToast],
  );

  const togglePendingId = toggleActive.isPending
    ? ((toggleActive.variables as { id: number } | undefined)?.id ?? null)
    : null;

  return {
    data: {
      categories: categoriesQuery.data ?? [],
      showForm: crud.showForm,
      formClosing: crud.formClosing,
      form: crud.form,
      deleteConfirm: crud.deleteConfirm,
      loadingCategoryId: crud.deletingId,
      togglePendingId,
    },
    loading: categoriesQuery.isLoading,
    formSaving: crud.formSaving,
    actions: {
      onToggleForm: crud.toggleForm,
      onFormChange: crud.onFormChange,
      onSave: crud.save,
      onEdit: crud.edit,
      onRequestDelete: crud.requestDelete,
      onCancelDelete: crud.closeDeleteConfirm,
      onConfirmDelete: crud.confirmDelete,
      onToggleActive: handleToggleActive,
    },
  };
}