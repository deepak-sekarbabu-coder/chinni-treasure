import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import CheckoutProgress from "../CheckoutProgress";

describe("CheckoutProgress", () => {
  it("renders all 3 step labels", () => {
    render(<CheckoutProgress currentStep={1} />);
    expect(screen.getByText("Personal")).toBeInTheDocument();
    expect(screen.getByText("Delivery")).toBeInTheDocument();
    expect(screen.getByText("Payment")).toBeInTheDocument();
  });

  it("marks the current step with aria-current='step'", () => {
    const { container } = render(<CheckoutProgress currentStep={2} />);
    const currentStep = container.querySelector('[aria-current="step"]');
    expect(currentStep).toBeTruthy();
  });

  it("displays step name in aria-live region", () => {
    render(<CheckoutProgress currentStep={2} />);
    expect(screen.getByText("Step 2 of 3: Delivery")).toBeInTheDocument();
  });

  it("handles step 1 correctly", () => {
    const { container } = render(<CheckoutProgress currentStep={1} />);
    expect(screen.getByText("Step 1 of 3: Personal")).toBeInTheDocument();
  });

  it("handles step 3 correctly", () => {
    render(<CheckoutProgress currentStep={3} />);
    expect(screen.getByText("Step 3 of 3: Payment")).toBeInTheDocument();
  });

  it("renders connectors between steps", () => {
    const { container } = render(<CheckoutProgress currentStep={1} />);
    const connectors = container.querySelectorAll(".checkout-step-connector");
    expect(connectors.length).toBe(2);
  });

  it("applies completed class to previous steps", () => {
    const { container } = render(<CheckoutProgress currentStep={2} />);
    const completedSteps = container.querySelectorAll(".checkout-step.completed");
    expect(completedSteps.length).toBe(1);
  });

  it("applies current class to the active step", () => {
    const { container } = render(<CheckoutProgress currentStep={3} />);
    const currentSteps = container.querySelectorAll(".checkout-step.current");
    expect(currentSteps.length).toBe(1);
  });

  it("sets role='navigation' and aria-label", () => {
    const { container } = render(<CheckoutProgress currentStep={1} />);
    const nav = container.querySelector('[role="navigation"]');
    expect(nav).toBeTruthy();
    expect(nav?.getAttribute("aria-label")).toBe("Checkout progress");
  });

  it("handles currentStep beyond range gracefully", () => {
    render(<CheckoutProgress currentStep={99} />);
    expect(screen.getByText(/Step 99 of 3:/)).toBeInTheDocument();
  });
});
