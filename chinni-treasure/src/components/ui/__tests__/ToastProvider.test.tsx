import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, renderHook, act, screen } from "@testing-library/react";
import { ToastProvider, useToast } from "../ToastProvider";

describe("ToastProvider", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function renderToasts() {
    return renderHook(() => useToast(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <ToastProvider>{children}</ToastProvider>
      ),
    });
  }

  it("showToast displays a toast message in the DOM", () => {
    const { result } = renderToasts();

    act(() => {
      result.current.showToast("Test notification");
    });

    expect(screen.getByText("Test notification")).toBeInTheDocument();
  });

  it("renders toast with different types: success, error, info", () => {
    const { result } = renderToasts();

    act(() => {
      result.current.showToast("Success!", "success");
      result.current.showToast("Error!", "error");
      result.current.showToast("Info!", "info");
    });

    expect(screen.getByText("Success!")).toBeInTheDocument();
    expect(screen.getByText("Error!")).toBeInTheDocument();
    expect(screen.getByText("Info!")).toBeInTheDocument();
    expect(screen.getByText("✓")).toBeInTheDocument();
    expect(screen.getByText("✕")).toBeInTheDocument();
    expect(screen.getByText("●")).toBeInTheDocument();
  });

  it("auto-dismisses toast after 3 seconds plus animation time", () => {
    const { result } = renderToasts();

    act(() => {
      result.current.showToast("Test notification");
    });

    expect(screen.getByText("Test notification")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3300);
    });

    expect(screen.queryByText("Test notification")).not.toBeInTheDocument();
  });

  it("has aria-live polite region for accessibility", () => {
    render(
      <ToastProvider>
        <div />
      </ToastProvider>,
    );

    const region = screen.getByRole("region");
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region).toHaveAttribute("aria-label", "Notifications");
  });

  it("renders multiple toasts simultaneously", () => {
    const { result } = renderToasts();

    act(() => {
      result.current.showToast("First");
      result.current.showToast("Second");
    });

    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
  });

  it("throws when used outside provider", () => {
    const { result } = renderHook(() => {
      try {
        return useToast();
      } catch (e) {
        return e;
      }
    });

    expect(result.current).toBeInstanceOf(Error);
    expect((result.current as Error).message).toContain("useToast must be used within ToastProvider");
  });

  it("renders Provider without error", () => {
    const { result } = renderToasts();
    expect(result.current).toBeDefined();
  });
});
