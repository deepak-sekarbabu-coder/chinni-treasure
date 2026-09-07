"use client";

import { useAdminCategories } from "@/src/lib/hooks/useAdminData";
import { useAdminCategoriesController } from "@/src/lib/hooks/useAdminCategoriesController";
import type { Category } from "@/src/lib/api/schemas";
import type { CategoryFormState } from "@/src/lib/hooks/useAdminCategoriesController";

/**
 * Categories panel-view module.
 *
 * Owns the full category list (including inactive — admin management and the
 * product form both need it) and the category form / delete / toggle
 * controller, behind one typed view-model.
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
  const categoriesQuery = useAdminCategories(authenticated, true);
  const controller = useAdminCategoriesController();

  return {
    data: {
      categories: categoriesQuery.data ?? [],
      showForm: controller.showForm,
      formClosing: controller.formClosing,
      form: controller.form,
      deleteConfirm: controller.deleteConfirm,
      loadingCategoryId: controller.loadingCategoryId,
      togglePendingId: controller.togglePendingId,
    },
    loading: categoriesQuery.isLoading,
    formSaving: controller.productLoading,
    actions: {
      onToggleForm: controller.toggleForm,
      onFormChange: controller.onFormChange,
      onSave: controller.handleSave,
      onEdit: controller.editCategory,
      onRequestDelete: controller.requestDelete,
      onCancelDelete: controller.closeDeleteConfirm,
      onConfirmDelete: controller.handleDeleteConfirmed,
      onToggleActive: controller.handleToggleActive,
    },
  };
}
