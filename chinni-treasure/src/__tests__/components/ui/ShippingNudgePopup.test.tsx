import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock useFocusTrap to avoid actual focus trapping in tests
vi.mock("@/src/lib/useFocusTrap", () => ({
  useFocusTrap: () => ({ current: null }),
}));

import ShippingNudgePopup from "../../../components/ui/ShippingNudgePopup";

describe("ShippingNudgePopup", () => {
  const defaultProps = {
    show: true,
    newTotal: 75,
    shippingLeft: 524,
    dismiss: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when show is false", () => {
    const { container } = render(
      <ShippingNudgePopup {...defaultProps} show={false} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("displays the correct cart total", () => {
    render(<ShippingNudgePopup {...defaultProps} />);
    expect(screen.getByText("₹75")).toBeTruthy();
  });

  it("displays the correct amount needed for free shipping", () => {
    render(<ShippingNudgePopup {...defaultProps} />);
    expect(
      screen.getByText(/Add ₹524 more for FREE shipping/),
    ).toBeTruthy();
  });

  it("displays the threshold in the description", () => {
    render(<ShippingNudgePopup {...defaultProps} />);
    expect(
      screen.getByText(/Reach ₹599 to skip shipping charges/),
    ).toBeTruthy();
  });

  it("shows the progress bar with correct aria attributes", () => {
    render(<ShippingNudgePopup {...defaultProps} />);
    const progressbar = screen.getByRole("progressbar");
    expect(progressbar.getAttribute("aria-valuemin")).toBe("0");
    expect(progressbar.getAttribute("aria-valuemax")).toBe("599");
    expect(progressbar.getAttribute("aria-valuenow")).toBe("75");
  });

  it("computes progress bar width correctly", () => {
    render(<ShippingNudgePopup {...defaultProps} />);
    const fill = document.querySelector(".shipping-nudge-progress-fill");
    expect(fill).toBeTruthy();
    // 75/599 ≈ 12.52%
    const width = fill?.getAttribute("style");
    expect(width).toContain("12.");
  });

  it("calls dismiss when clicking the overlay", () => {
    const dismiss = vi.fn();
    render(<ShippingNudgePopup {...defaultProps} dismiss={dismiss} />);

    const overlay = document.querySelector(".shipping-nudge-overlay");
    fireEvent.click(overlay!);
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it("does not dismiss when clicking inside the sheet", () => {
    const dismiss = vi.fn();
    render(<ShippingNudgePopup {...defaultProps} dismiss={dismiss} />);

    const sheet = document.querySelector(".shipping-nudge-sheet");
    fireEvent.click(sheet!);
    expect(dismiss).not.toHaveBeenCalled();
  });

  it("calls dismiss when clicking Continue Shopping", () => {
    const dismiss = vi.fn();
    render(<ShippingNudgePopup {...defaultProps} dismiss={dismiss} />);

    const continueBtn = screen.getByText("Continue Shopping");
    fireEvent.click(continueBtn);
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it("calls dismiss when clicking No thanks", () => {
    const dismiss = vi.fn();
    render(<ShippingNudgePopup {...defaultProps} dismiss={dismiss} />);

    const noThanks = screen.getByText("No thanks");
    fireEvent.click(noThanks);
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it("calls dismiss on Escape key", () => {
    const dismiss = vi.fn();
    render(<ShippingNudgePopup {...defaultProps} dismiss={dismiss} />);

    const overlay = document.querySelector(".shipping-nudge-overlay");
    fireEvent.keyDown(overlay!, { key: "Escape" });
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it("shows Cart total label with the value", () => {
    render(<ShippingNudgePopup {...defaultProps} />);
    expect(screen.getByText("Cart total")).toBeTruthy();
    expect(screen.getByText("₹75")).toBeTruthy();
  });

  it("clamps progress to 100% for values at threshold", () => {
    const { container } = render(
      <ShippingNudgePopup
        {...defaultProps}
        newTotal={599}
        shippingLeft={0}
      />,
    );
    const fill = container.querySelector(".shipping-nudge-progress-fill");
    expect(fill?.getAttribute("style")).toContain("100");
  });
});
