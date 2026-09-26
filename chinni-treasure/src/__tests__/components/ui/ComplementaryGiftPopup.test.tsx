import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import ComplementaryGiftPopup from "../../../components/ui/ComplementaryGiftPopup";

const pathnameMock = { current: "/" };

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock.current,
}));

describe("ComplementaryGiftPopup", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    pathnameMock.current = "/";
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("appears after the show delay with gift content", () => {
    render(<ComplementaryGiftPopup />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Every Order Comes With A Gift")).toBeInTheDocument();
    expect(screen.getByText("Handwritten Note")).toBeInTheDocument();
    expect(screen.getByText("Customized Notes for Gift Recipients")).toBeInTheDocument();
  });

  it("auto-dismisses 10 seconds after appearing", () => {
    render(<ComplementaryGiftPopup />);

    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(10000);
      vi.advanceTimersByTime(300);
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("dismisses via the manual close button", () => {
    render(<ComplementaryGiftPopup />);

    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close gift popup" }));

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("dismisses on Escape key", () => {
    render(<ComplementaryGiftPopup />);

    act(() => {
      vi.advanceTimersByTime(600);
    });

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not appear on admin pages", () => {
    pathnameMock.current = "/admin";

    render(<ComplementaryGiftPopup />);

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not appear again within the same session after being shown", () => {
    const first = render(<ComplementaryGiftPopup />);
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    first.unmount();

    // Simulate navigating to another page in the same session.
    pathnameMock.current = "/catalogue";
    render(<ComplementaryGiftPopup />);
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("marks itself as shown for the session when displayed", () => {
    render(<ComplementaryGiftPopup />);

    expect(window.sessionStorage.getItem("gift-popup-shown")).toBeNull();

    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(window.sessionStorage.getItem("gift-popup-shown")).toBe("1");
  });

  it("exposes accessible dialog semantics", () => {
    render(<ComplementaryGiftPopup />);

    act(() => {
      vi.advanceTimersByTime(600);
    });

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "gift-popup-title");
    expect(dialog).toHaveAttribute("aria-describedby", "gift-popup-copy");
  });
});
