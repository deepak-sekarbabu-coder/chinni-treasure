import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import React from "react";
import Navbar from "../Navbar";
import { CartProvider, useCart } from "@/src/components/cart/CartProvider";

function renderNavbar() {
  return render(
    <CartProvider>
      <Navbar />
    </CartProvider>,
  );
}

describe("Navbar", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.stubGlobal("scrollY", 0);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders brand name and links", () => {
    renderNavbar();
    expect(screen.getByText("Chinni Treasure")).toBeInTheDocument();
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Catalogue")).toBeInTheDocument();
    expect(screen.getByText("Track")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("has navigation role and aria-label", () => {
    renderNavbar();
    const nav = screen.getByRole("navigation");
    expect(nav).toHaveAttribute("aria-label", "Main navigation");
  });

  it("starts without scrolled class", () => {
    const { container } = renderNavbar();
    expect(container.querySelector(".navbar")?.className).not.toContain("scrolled");
  });

  it("adds scrolled class when page is scrolled past 50px", () => {
    const { container } = renderNavbar();

    act(() => {
      Object.defineProperty(window, "scrollY", { value: 100, writable: true });
      window.dispatchEvent(new Event("scroll"));
    });

    expect(container.querySelector(".navbar")?.className).toContain("scrolled");
  });

  it("removes scrolled class when scrolled back up", () => {
    const { container } = renderNavbar();

    act(() => {
      Object.defineProperty(window, "scrollY", { value: 100, writable: true });
      window.dispatchEvent(new Event("scroll"));
    });

    expect(container.querySelector(".navbar")?.className).toContain("scrolled");

    act(() => {
      Object.defineProperty(window, "scrollY", { value: 0, writable: true });
      window.dispatchEvent(new Event("scroll"));
    });

    expect(container.querySelector(".navbar")?.className).not.toContain("scrolled");
  });

  it("toggles menu on hamburger click", () => {
    renderNavbar();
    const hamburger = screen.getByLabelText("Toggle menu");
    const navLinks = document.getElementById("nav-links");

    expect(navLinks?.className).not.toContain("active");

    fireEvent.click(hamburger);
    expect(navLinks?.className).toContain("active");

    fireEvent.click(hamburger);
    expect(navLinks?.className).not.toContain("active");
  });

  it("toggles aria-expanded on hamburger button", () => {
    renderNavbar();
    const hamburger = screen.getByLabelText("Toggle menu");

    expect(hamburger).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(hamburger);
    expect(hamburger).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(hamburger);
    expect(hamburger).toHaveAttribute("aria-expanded", "false");
  });

  it("closes menu when a nav link is clicked", () => {
    renderNavbar();
    fireEvent.click(screen.getByLabelText("Toggle menu"));
    expect(document.getElementById("nav-links")?.className).toContain("active");

    fireEvent.click(screen.getByText("Catalogue"));
    expect(document.getElementById("nav-links")?.className).not.toContain("active");
  });

  it("cart button opens and closes cart dropdown", () => {
    renderNavbar();
    const cartBtn = screen.getByLabelText("Shopping cart");
    const dropdown = document.querySelector(".cart-dropdown");

    expect(dropdown?.className).not.toContain("active");

    fireEvent.click(cartBtn);
    expect(dropdown?.className).toContain("active");

    fireEvent.click(cartBtn);
    expect(dropdown?.className).not.toContain("active");
  });

  it("closes cart when clicking outside", () => {
    renderNavbar();
    fireEvent.click(screen.getByLabelText("Shopping cart"));
    expect(document.querySelector(".cart-dropdown")?.className).toContain("active");

    fireEvent.click(document.body);
    expect(document.querySelector(".cart-dropdown")?.className).not.toContain("active");
  });

  it("cart overlay click closes the dropdown", () => {
    renderNavbar();
    fireEvent.click(screen.getByLabelText("Shopping cart"));
    expect(document.querySelector(".cart-overlay")?.className).toContain("active");

    fireEvent.click(document.querySelector(".cart-overlay")!);
    expect(document.querySelector(".cart-dropdown")?.className).not.toContain("active");
  });

  it("shows empty cart message when no items", () => {
    renderNavbar();
    fireEvent.click(screen.getByLabelText("Shopping cart"));
    expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
  });

  it("shows cart items in dropdown when items exist", () => {
    render(
      <CartProvider>
        <NavbarTestHelper />
      </CartProvider>,
    );

    fireEvent.click(screen.getByLabelText("Shopping cart"));

    expect(screen.getByText("Test Product")).toBeInTheDocument();
    expect(screen.getByText("₹29.99 each")).toBeInTheDocument();
    expect(screen.getByLabelText("Remove Test Product from cart")).toBeInTheDocument();
  });

  it("shows cart total in dropdown", () => {
    render(
      <CartProvider>
        <NavbarTestHelper />
      </CartProvider>,
    );

    fireEvent.click(screen.getByLabelText("Shopping cart"));
    const totalEl = document.getElementById("cart-dropdown-total");
    expect(totalEl?.textContent).toBe("₹29.99");
  });

  it("removes item from cart via dropdown", () => {
    render(
      <CartProvider>
        <NavbarTestHelper />
      </CartProvider>,
    );

    fireEvent.click(screen.getByLabelText("Shopping cart"));
    fireEvent.click(screen.getByLabelText("Remove Test Product from cart"));
    expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
  });

  it("has role='menubar' on nav links", () => {
    renderNavbar();
    expect(document.querySelector('[role="menubar"]')).toBeTruthy();
  });

  it("has aria-current='page' on Home link when pathname is /", () => {
    renderNavbar();
    expect(screen.getByText("Home").closest("a")).toHaveAttribute("aria-current", "page");
  });

  it("renders cart with aria-label", () => {
    renderNavbar();
    expect(screen.getByLabelText("Shopping cart")).toBeInTheDocument();
  });

  it("renders cart dropdown title when opened", () => {
    renderNavbar();
    fireEvent.click(screen.getByLabelText("Shopping cart"));
    expect(screen.getByText("Shopping Cart")).toBeInTheDocument();
  });

  it("closes hamburger menu when Home link is clicked", () => {
    renderNavbar();
    fireEvent.click(screen.getByLabelText("Toggle menu"));
    expect(document.getElementById("nav-links")?.className).toContain("active");

    fireEvent.click(screen.getByText("Home"));
    expect(document.getElementById("nav-links")?.className).not.toContain("active");
  });

  it("closes menu when Track link is clicked", () => {
    renderNavbar();
    fireEvent.click(screen.getByLabelText("Toggle menu"));
    expect(document.getElementById("nav-links")?.className).toContain("active");

    fireEvent.click(screen.getByText("Track"));
    expect(document.getElementById("nav-links")?.className).not.toContain("active");
  });

  it("closes menu when Admin link is clicked", () => {
    renderNavbar();
    fireEvent.click(screen.getByLabelText("Toggle menu"));
    expect(document.getElementById("nav-links")?.className).toContain("active");

    fireEvent.click(screen.getByText("Admin"));
    expect(document.getElementById("nav-links")?.className).not.toContain("active");
  });

  it("has cart dropdown with shopping cart preview label", () => {
    renderNavbar();
    expect(screen.getByLabelText("Shopping cart preview")).toBeInTheDocument();
  });

  it("view cart and checkout buttons render in cart dropdown", () => {
    render(
      <CartProvider>
        <NavbarTestHelper />
      </CartProvider>,
    );
    fireEvent.click(screen.getByLabelText("Shopping cart"));
    expect(screen.getByText("View Cart")).toBeInTheDocument();
    expect(screen.getByText("Checkout")).toBeInTheDocument();
  });

  it("isActive returns false for non-matching paths on non-home links", () => {
    renderNavbar();
    const catalogueLink = screen.getByText("Catalogue");
    expect(catalogueLink.closest("a")?.className).not.toContain("active");
  });

  it("hamburger button closes cart if open", () => {
    renderNavbar();
    fireEvent.click(screen.getByLabelText("Shopping cart"));
    expect(document.querySelector(".cart-dropdown")?.className).toContain("active");

    fireEvent.click(screen.getByLabelText("Toggle menu"));
    expect(document.querySelector(".cart-dropdown")?.className).not.toContain("active");
    expect(document.getElementById("nav-links")?.className).toContain("active");
  });

  it("view cart button closes cart dropdown", () => {
    render(
      <CartProvider>
        <NavbarTestHelper />
      </CartProvider>,
    );
    fireEvent.click(screen.getByLabelText("Shopping cart"));
    expect(document.querySelector(".cart-dropdown")?.className).toContain("active");
    const viewCartBtn = screen.getByText("View Cart");
    fireEvent.click(viewCartBtn);
    expect(document.querySelector(".cart-dropdown")?.className).not.toContain("active");
  });

  it("shipping note renders in cart dropdown when cart has items", () => {
    render(
      <CartProvider>
        <NavbarTestHelper />
      </CartProvider>,
    );
    fireEvent.click(screen.getByLabelText("Shopping cart"));
    expect(screen.getByText(/Free shipping/)).toBeInTheDocument();
  });

  it("quantity controls render in cart dropdown", () => {
    render(
      <CartProvider>
        <NavbarTestHelper />
      </CartProvider>,
    );
    fireEvent.click(screen.getByLabelText("Shopping cart"));
    expect(screen.getByLabelText("Decrease quantity of Test Product")).toBeInTheDocument();
    expect(screen.getByLabelText("Increase quantity of Test Product")).toBeInTheDocument();
  });

  it("quantity decreases and removes item when qty reaches 0", () => {
    render(
      <CartProvider>
        <NavbarTestHelper />
      </CartProvider>,
    );
    fireEvent.click(screen.getByLabelText("Shopping cart"));
    const decBtn = screen.getByLabelText("Decrease quantity of Test Product");
    fireEvent.click(decBtn);
    expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
  });

  it("low-stock warning appears when stock is 3 or fewer", () => {
    render(
      <CartProvider>
        <NavbarTestHelperLowStock />
      </CartProvider>,
    );
    fireEvent.click(screen.getByLabelText("Shopping cart"));
    expect(screen.getByText(/only 3 left/i)).toBeInTheDocument();
  });

  it("Track link closes menu", () => {
    renderNavbar();
    fireEvent.click(screen.getByLabelText("Toggle menu"));
    expect(document.getElementById("nav-links")?.className).toContain("active");
    fireEvent.click(screen.getByText("Track"));
    expect(document.getElementById("nav-links")?.className).not.toContain("active");
  });
});

function NavbarTestHelper() {
  const { addItem } = useCart();
  React.useEffect(() => {
    addItem({ id: "prod-1", name: "Test Product", price: 29.99, image: "/test.jpg", stock: 10 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <Navbar />;
}

function NavbarTestHelperLowStock() {
  const { addItem } = useCart();
  React.useEffect(() => {
    addItem({ id: "prod-1", name: "Low Stock Product", price: 49.99, image: "/test.jpg", stock: 3 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <Navbar />;
}
