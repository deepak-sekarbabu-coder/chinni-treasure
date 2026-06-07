import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("@/src/lib/hooks/useAdminData", () => ({
  useAuthMe: vi.fn(),
}));

import { useAuthMe } from "@/src/lib/hooks/useAdminData";
import { useAdminSession } from "../useAdminSession";

const mockUseAuthMe = vi.mocked(useAuthMe);

describe("useAdminSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reports loading while the auth query is pending", () => {
    mockUseAuthMe.mockReturnValue({
      isPending: true,
      isSuccess: false,
      isError: false,
      data: undefined,
      error: null,
    } as unknown as ReturnType<typeof useAuthMe>);

    const { result } = renderHook(() => useAdminSession());
    expect(result.current.authLoading).toBe(true);
    expect(result.current.authenticated).toBe(false);
    expect(result.current.ready).toBe(false);
  });

  it("reports authenticated and ready on a successful session", () => {
    mockUseAuthMe.mockReturnValue({
      isPending: false,
      isSuccess: true,
      isError: false,
      data: { authenticated: true, id: "1", username: "admin", role: "admin" },
      error: null,
    } as unknown as ReturnType<typeof useAuthMe>);

    const { result } = renderHook(() => useAdminSession());
    expect(result.current.authenticated).toBe(true);
    expect(result.current.authLoading).toBe(false);
    expect(result.current.ready).toBe(true);
  });

  it("redirects and reports unauthenticated when session is missing", async () => {
    const push = vi.fn();
    const useRouterSpy = vi.spyOn(await import("next/navigation"), "useRouter");
    useRouterSpy.mockReturnValue({ push } as unknown as ReturnType<typeof useRouterSpy>);

    mockUseAuthMe.mockReturnValue({
      isPending: false,
      isSuccess: true,
      isError: false,
      data: { authenticated: false },
      error: null,
    } as unknown as ReturnType<typeof useAuthMe>);

    const { result } = renderHook(() => useAdminSession());
    expect(result.current.authenticated).toBe(false);
    expect(result.current.ready).toBe(true);

    await act(async () => {
      await Promise.resolve();
    });
    expect(push).toHaveBeenCalledWith("/admin/login");
  });
});
