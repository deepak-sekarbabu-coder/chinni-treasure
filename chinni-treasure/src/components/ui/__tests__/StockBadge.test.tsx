import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StockBadge from "../StockBadge";

describe("StockBadge", () => {
  it('renders "Out of Stock" when stockQuantity is 0', () => {
    render(<StockBadge stockQuantity={0} />);
    expect(screen.getByText("Out of Stock")).toBeInTheDocument();
  });

  it('renders "Out of Stock" when stockQuantity is negative', () => {
    render(<StockBadge stockQuantity={-1} />);
    expect(screen.getByText("Out of Stock")).toBeInTheDocument();
  });

  it('renders "Only N left" when stockQuantity is 1', () => {
    render(<StockBadge stockQuantity={1} />);
    expect(screen.getByText("Only 1 left")).toBeInTheDocument();
  });

  it('renders "Only N left" when stockQuantity is 3 (boundary)', () => {
    render(<StockBadge stockQuantity={3} />);
    expect(screen.getByText("Only 3 left")).toBeInTheDocument();
  });

  it('renders "In Stock" when stockQuantity is 4', () => {
    render(<StockBadge stockQuantity={4} />);
    expect(screen.getByText("In Stock")).toBeInTheDocument();
  });

  it('renders "In Stock" when stockQuantity is large', () => {
    render(<StockBadge stockQuantity={999} />);
    expect(screen.getByText("In Stock")).toBeInTheDocument();
  });

  it("applies the correct CSS class for empty state", () => {
    const { container } = render(<StockBadge stockQuantity={0} />);
    expect(container.querySelector(".stock-badge.empty")).toBeTruthy();
  });

  it("applies the correct CSS class for low state", () => {
    const { container } = render(<StockBadge stockQuantity={2} />);
    expect(container.querySelector(".stock-badge.low")).toBeTruthy();
  });

  it("applies the correct CSS class for in-stock state", () => {
    const { container } = render(<StockBadge stockQuantity={10} />);
    expect(container.querySelector(".stock-badge.in-stock")).toBeTruthy();
  });
});
