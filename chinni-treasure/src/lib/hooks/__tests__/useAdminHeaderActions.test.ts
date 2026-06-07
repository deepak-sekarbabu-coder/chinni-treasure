import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("@/src/lib/hooks/useAdminMutations", () => ({
  useExportToExcel: vi.fn(),
  useLogout: vi.fn(),
}));

vi.mock("@/src/components/ui/ToastProvider", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

import { useExportToExcel, useLogout } from "@/src/lib/hooks/useAdminMutations";
import { useAdminHeaderActions } from "../useAdminHeaderActions";

const mockUseExportToExcel = vi.mocked(useExportToExcel);
const mockUseLogout = vi.mocked(useLogout);

const routerMock = { push: vi.fn() };

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

describe("useAdminHeaderActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to login after logout", async () => {
    mockUseLogout.mockReturnValue({
      isPending: false,
      mutateAsync: vi.fn().mockResolvedValue(undefined),
    } as unknown as ReturnType<typeof useLogout>);
    mockUseExportToExcel.mockReturnValue({
      isPending: false,
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof useExportToExcel>);

    const { result } = renderHook(() => useAdminHeaderActions());

    await act(async () => {
      await result.current.handleLogout();
    });

    expect(routerMock.push).toHaveBeenCalledWith("/admin/login");
  });

  it("redirects to login even if logout fails", async () => {
    mockUseLogout.mockReturnValue({
      isPending: false,
      mutateAsync: vi.fn().mockRejectedValue(new Error("network")),
    } as unknown as ReturnType<typeof useLogout>);
    mockUseExportToExcel.mockReturnValue({
      isPending: false,
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof useExportToExcel>);

    const { result } = renderHook(() => useAdminHeaderActions());

    await act(async () => {
      await result.current.handleLogout();
    });

    expect(routerMock.push).toHaveBeenCalledWith("/admin/login");
  });

  it("triggers a file download on a successful export", async () => {
    const blob = new Blob(["data"], { type: "application/vnd.ms-excel" });
    mockUseLogout.mockReturnValue({
      isPending: false,
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof useLogout>);
    mockUseExportToExcel.mockReturnValue({
      isPending: false,
      mutateAsync: vi.fn().mockResolvedValue(blob),
    } as unknown as ReturnType<typeof useExportToExcel>);

    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    const { result } = renderHook(() => useAdminHeaderActions());

    await act(async () => {
      await result.current.handleExport();
    });

    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });
});
