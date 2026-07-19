import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ProductCard from "../ProductCard";

const baseProduct = {
  id: "prod-1",
  name: "Silk Saree",
  price: 2499.99,
  imageUrl: "/images/silk-saree.jpg",
  description: "Handwoven silk saree with gold embroidery",
  category: { name: "Sarees" },
  stockQuantity: 5,
  badge: "Bestseller",
};

describe("ProductCard", () => {
  it("renders product name, price, and description", async () => {
    render(<ProductCard product={baseProduct} onAdd={vi.fn()} />);
    expect(screen.getByText("Silk Saree")).toBeInTheDocument();
    expect(screen.getByText("₹2499.99")).toBeInTheDocument();
    expect(await screen.findByText("Handwoven silk saree with gold embroidery")).toBeInTheDocument();
  });

  it("renders the category name", () => {
    render(<ProductCard product={baseProduct} onAdd={vi.fn()} />);
    expect(screen.getByText("Sarees")).toBeInTheDocument();
  });

  it('falls back to "General" when category is null', () => {
    render(<ProductCard product={{ ...baseProduct, category: null }} onAdd={vi.fn()} />);
    expect(screen.getByText("General")).toBeInTheDocument();
  });

  it("renders the badge when present", () => {
    render(<ProductCard product={baseProduct} onAdd={vi.fn()} />);
    expect(screen.getByText("Bestseller")).toBeInTheDocument();
  });

  it("does not render badge when null", () => {
    const { container } = render(
      <ProductCard product={{ ...baseProduct, badge: null }} onAdd={vi.fn()} />,
    );
    expect(container.querySelector(".product-card-badge")).toBeNull();
  });

  it("renders Add to Cart button when in stock", () => {
    render(<ProductCard product={baseProduct} onAdd={vi.fn()} />);
    expect(screen.getByText("Add to Cart")).toBeInTheDocument();
  });

  it("renders Sold Out button when out of stock", () => {
    render(
      <ProductCard product={{ ...baseProduct, stockQuantity: 0 }} onAdd={vi.fn()} />,
    );
    expect(screen.getByText("Sold Out")).toBeInTheDocument();
  });

  it("disables button when out of stock", () => {
    render(
      <ProductCard product={{ ...baseProduct, stockQuantity: 0 }} onAdd={vi.fn()} />,
    );
    expect(screen.getByText("Sold Out")).toBeDisabled();
  });

  it("calls onAdd with product data when Add to Cart is clicked", () => {
    const onAdd = vi.fn();
    render(<ProductCard product={baseProduct} onAdd={onAdd} />);
    fireEvent.click(screen.getByText("Add to Cart"));
    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd).toHaveBeenCalledWith(baseProduct);
  });

  it("applies transition delay style", () => {
    const { container } = render(
      <ProductCard product={baseProduct} onAdd={vi.fn()} transitionDelay={0.3} />,
    );
    const card = container.querySelector(".product-card");
    expect(card?.getAttribute("style")).toContain("transition-delay: 0.3s");
  });

  it("defaults transition delay to 0s when not provided", () => {
    const { container } = render(<ProductCard product={baseProduct} onAdd={vi.fn()} />);
    const card = container.querySelector(".product-card");
    expect(card?.getAttribute("style")).toContain("transition-delay: 0s");
  });

  it("renders with role listitem", () => {
    const { container } = render(<ProductCard product={baseProduct} onAdd={vi.fn()} />);
    expect(container.querySelector('[role="listitem"]')).toBeTruthy();
  });
});
