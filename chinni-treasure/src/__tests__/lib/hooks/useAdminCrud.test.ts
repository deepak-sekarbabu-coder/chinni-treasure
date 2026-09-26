import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const { toastSpy } = vi.hoisted(() => ({ toastSpy: vi.fn() }));

vi.mock("@/src/components/ui/ToastProvider", () => ({
  useToast: () => ({ showToast: toastSpy }),
}));

import { useAdminCrud } from "../../../lib/hooks/useAdminCrud";

interface FakeForm {
  id: string | null;
  name: string;
}

function makeConfig(overrides: Partial<Parameters<typeof useAdminCrud>[0]> = {}) {
  return {
    emptyForm: { id: null, name: "" },
    emptyDeleteState: { open: false, id: "" },
    toFormState: (e: { id: string; name: string }) => ({ id: e.id, name: e.name }),
    toDeleteState: (e: { id: string; name: string }) => ({ open: true, id: e.id }),
    deleteId: (state: { open: boolean; id: string }) => state.id || null,
    validate: (form: FakeForm) => (form.name.trim() ? null : "Name required"),
    buildPayload: (form: FakeForm) => ({ name: form.name }),
    save: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
    saving: false,
    deleting: false,
    createdToast: () => "created",
    updatedToast: () => "updated",
    deletedToast: "deleted",
    saveErrorFallback: "Save failed",
    deleteErrorFallback: "Delete failed",
    ...overrides,
  };
}

const entity = { id: "e1", name: "Thing" };

beforeEach(() => {
  toastSpy.mockClear();
});

describe("useAdminCrud", () => {
  it("opens, prefills on edit, and resets to the blank form after the close timer", async () => {
    vi.useFakeTimers();
    const cfg = makeConfig();
    const { result } = renderHook(() => useAdminCrud(cfg));

    act(() => result.current.edit(entity));
    expect(result.current.showForm).toBe(true);
    expect(result.current.form).toEqual({ id: "e1", name: "Thing" });

    await act(async () => {
      result.current.toggleForm(); // open → close
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(result.current.showForm).toBe(false);
    expect(result.current.form).toEqual(cfg.emptyForm);
    vi.useRealTimers();
  });

  it("blocks an invalid save with the validation message", async () => {
    const cfg = makeConfig();
    const { result } = renderHook(() => useAdminCrud(cfg));

    act(() => result.current.toggleForm());
    await act(async () => {
      await result.current.save({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(cfg.save).not.toHaveBeenCalled();
    expect(toastSpy).toHaveBeenCalledWith("Name required", "error");
    expect(result.current.showForm).toBe(true);
  });

  it("toasts the error message and keeps the form open when save throws", async () => {
    const cfg = makeConfig({ save: vi.fn().mockRejectedValue(new Error("boom")) });
    const { result } = renderHook(() => useAdminCrud(cfg));

    act(() => result.current.toggleForm());
    act(() => result.current.onFormChange({ id: null, name: "X" }));
    await act(async () => {
      await result.current.save({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(toastSpy).toHaveBeenCalledWith("boom", "error");
    expect(result.current.showForm).toBe(true);
  });

  it("runs the delete, toasts, and closes the confirm", async () => {
    const cfg = makeConfig();
    const { result } = renderHook(() => useAdminCrud(cfg));

    act(() => result.current.requestDelete(entity));
    expect(result.current.deleteConfirm).toEqual({ open: true, id: "e1" });

    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(cfg.remove).toHaveBeenCalledWith("e1");
    expect(toastSpy).toHaveBeenCalledWith("deleted", "success");
    expect(result.current.deleteConfirm).toEqual(cfg.emptyDeleteState);
  });

  it("toasts the fallback when the rejection carries no message, and keeps the confirm open", async () => {
    const cfg = makeConfig({ remove: vi.fn().mockRejectedValue({ status: 500 }) });
    const { result } = renderHook(() => useAdminCrud(cfg));

    act(() => result.current.requestDelete(entity));
    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(toastSpy).toHaveBeenCalledWith("Delete failed", "error");
    expect(result.current.deleteConfirm.open).toBe(true);
  });

  it("exposes deletingId only while a delete is in flight", () => {
    const cfg = makeConfig({ deleting: true });
    const { result } = renderHook(() => useAdminCrud(cfg));

    act(() => result.current.requestDelete(entity));
    expect(result.current.deletingId).toBe("e1");

    act(() => result.current.closeDeleteConfirm());
    expect(result.current.deletingId).toBeNull();
  });
});
