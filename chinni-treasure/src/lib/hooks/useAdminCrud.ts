"use client";

import { useCallback, useState } from "react";
import { useToast } from "@/src/components/ui/ToastProvider";
import { extractApiErrorMessage } from "@/src/lib/utils";

const FORM_CLOSE_ANIMATION_MS = 300;

/**
 * One admin-CRUD seam: the form / delete-confirm state machine and the
 * validate → save → toast → close skeleton that every admin entity controller
 * previously copied (catalogue × categories were line-for-line twins).
 *
 * Each entity supplies a policy object — blank form, validation, payload
 * building, the actual mutations, and its toast copy; the seam owns the state
 * and the try/catch/toast choreography so it cannot drift between entities.
 * The 300ms close animation matches the panel CSS transition.
 */
export interface AdminCrudConfig<
  TEntity,
  TForm extends { id: string | number | null },
  TDelete,
  TId extends string | number,
  TPayload,
> {
  /** Blank form for a create; also restores the form after close. */
  emptyForm: TForm;
  /** Closed delete-confirm state. */
  emptyDeleteState: TDelete;
  toFormState: (entity: TEntity) => TForm;
  toDeleteState: (entity: TEntity) => TDelete;
  /** Extract the delete target from the confirm state. */
  deleteId: (state: TDelete) => TId | null;
  /** Return an error message to block the save, or null to proceed. */
  validate: (form: TForm) => string | null;
  buildPayload: (form: TForm) => TPayload;
  /** Run the create/update mutation. Throw to keep the form open. */
  save: (form: TForm, payload: TPayload, isEdit: boolean) => Promise<unknown>;
  /** Run the delete mutation for the confirmed id. */
  remove: (id: TId) => Promise<unknown>;
  /** create.isPending || update.isPending, from the entity's mutations. */
  saving: boolean;
  /** delete.isPending. */
  deleting: boolean;
  createdToast: (form: TForm) => string;
  updatedToast: (form: TForm) => string;
  deletedToast: string;
  saveErrorFallback: string;
  deleteErrorFallback: string;
  /** Optional post-save hook (e.g. catalogue resets to page 1 after a create). */
  onSaved?: (wasCreate: boolean) => void;
}

export function useAdminCrud<
  TEntity,
  TForm extends { id: string | number | null },
  TDelete,
  TId extends string | number,
  TPayload,
>(cfg: AdminCrudConfig<TEntity, TForm, TDelete, TId, TPayload>) {
  const { showToast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [formClosing, setFormClosing] = useState(false);
  const [form, setForm] = useState<TForm>(cfg.emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<TDelete>(cfg.emptyDeleteState);

  const closeForm = useCallback(() => {
    setFormClosing(true);
    setTimeout(() => {
      setShowForm(false);
      setFormClosing(false);
      setForm(cfg.emptyForm);
    }, FORM_CLOSE_ANIMATION_MS);
  }, [cfg]);

  const toggleForm = useCallback(() => {
    if (showForm) {
      closeForm();
    } else {
      setForm(cfg.emptyForm);
      setShowForm(true);
    }
  }, [showForm, closeForm, cfg]);

  const edit = useCallback(
    (entity: TEntity) => {
      setFormClosing(false);
      setForm(cfg.toFormState(entity));
      setShowForm(true);
    },
    [cfg],
  );

  const requestDelete = useCallback(
    (entity: TEntity) => {
      setDeleteConfirm(cfg.toDeleteState(entity));
    },
    [cfg],
  );

  const closeDeleteConfirm = useCallback(() => {
    setDeleteConfirm(cfg.emptyDeleteState);
  }, [cfg]);

  const save = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const isEdit = !!form.id;
      const validationError = cfg.validate(form);
      if (validationError) {
        showToast(validationError, "error");
        return;
      }
      try {
        await cfg.save(form, cfg.buildPayload(form), isEdit);
        showToast(isEdit ? cfg.updatedToast(form) : cfg.createdToast(form), "success");
        cfg.onSaved?.(!isEdit);
        closeForm();
      } catch (err) {
        console.error(`${cfg.saveErrorFallback}:`, err);
        showToast(extractApiErrorMessage(err, cfg.saveErrorFallback), "error");
      }
    },
    [form, cfg, closeForm, showToast],
  );

  const confirmDelete = useCallback(async () => {
    const id = cfg.deleteId(deleteConfirm);
    if (!id) return;
    try {
      await cfg.remove(id);
      showToast(cfg.deletedToast, "success");
      setDeleteConfirm(cfg.emptyDeleteState);
    } catch (err) {
      console.error(`${cfg.deleteErrorFallback}:`, err);
      showToast(extractApiErrorMessage(err, cfg.deleteErrorFallback), "error");
    }
  }, [deleteConfirm, cfg, showToast]);

  const onFormChange = useCallback((next: TForm) => {
    setForm(next);
  }, []);

  return {
    showForm,
    formClosing,
    form,
    deleteConfirm,
    formSaving: cfg.saving,
    deleting: cfg.deleting,
    /** The id whose delete is in flight (for per-row busy spinners). */
    deletingId: cfg.deleting ? (cfg.deleteId(deleteConfirm) ?? null) : null,
    toggleForm,
    edit,
    requestDelete,
    closeDeleteConfirm,
    save,
    confirmDelete,
    onFormChange,
  };
}
