import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import OrderDetailModal from "../OrderDetailModal";

const baseOrder = {
  id: "order-1",
  orderNumber: "ORD-ABC123",
  customerName: "Jane Doe",
  customerEmail: "jane@example.com",
  customerPhone: "9876543210",
  status: "pending",
  totalAmount: 2999,
  subtotal: 2799,
  shippingCost: 200,
  createdAt: "2025-01-15T10:00:00Z",
  transactionId: "txn_123456",
  addressLine1: "123 Main St",
  city: "Mumbai",
  stateCode: "MH",
  postalCode: "400001",
  items: [
    { id: "item-1", productName: "Silk Saree", unitPrice: 2499, quantity: 1 },
    { id: "item-2", productName: "Bangles", unitPrice: 300, quantity: 1 },
  ],
};

describe("OrderDetailModal", () => {
  beforeEach(() => {
    document.body.style.overflow = "";
  });

  it("renders order number in header", () => {
    render(
      <OrderDetailModal order={baseOrder} onClose={vi.fn()} />,
    );
    expect(screen.getByText("Order ORD-ABC123")).toBeInTheDocument();
  });

  it("renders customer details", () => {
    render(<OrderDetailModal order={baseOrder} onClose={vi.fn()} />);
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
    expect(screen.getByText("9876543210")).toBeInTheDocument();
    expect(screen.getByText(/123 Main St, Mumbai, MH 400001/)).toBeInTheDocument();
  });

  it("renders order items in the table", () => {
    render(<OrderDetailModal order={baseOrder} onClose={vi.fn()} />);
    expect(screen.getByText("Silk Saree")).toBeInTheDocument();
    expect(screen.getByText("Bangles")).toBeInTheDocument();
  });

  it("renders subtotal, shipping, and total", () => {
    render(<OrderDetailModal order={baseOrder} onClose={vi.fn()} />);
    expect(screen.getByText("₹2799.00")).toBeInTheDocument();
    expect(screen.getByText("₹200.00")).toBeInTheDocument();
    expect(screen.getByText("₹2999.00")).toBeInTheDocument();
  });

  it("shows free shipping when shippingCost is 0", () => {
    render(
      <OrderDetailModal
        order={{ ...baseOrder, shippingCost: 0 }}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("Free")).toBeInTheDocument();
  });

  it("renders transaction ID", () => {
    render(<OrderDetailModal order={baseOrder} onClose={vi.fn()} />);
    expect(screen.getByText("txn_123456")).toBeInTheDocument();
  });

  it("renders status badge", () => {
    render(<OrderDetailModal order={baseOrder} onClose={vi.fn()} />);
    const pendingElements = screen.getAllByText(/Pending/);
    expect(pendingElements.length).toBeGreaterThanOrEqual(1);
    expect(document.querySelector(".status-badge")).toBeInTheDocument();
  });

  it("renders timeline for normal status flow", () => {
    const order = { ...baseOrder, status: "shipped" };
    render(<OrderDetailModal order={order} onClose={vi.fn()} />);
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("Approved")).toBeInTheDocument();
    expect(screen.getByText("Packaging")).toBeInTheDocument();
    expect(screen.getByText("Shipped")).toBeInTheDocument();
  });

  it("renders rejected timeline when status is rejected", () => {
    const order = { ...baseOrder, status: "rejected" };
    render(<OrderDetailModal order={order} onClose={vi.fn()} />);
    expect(screen.getByText("Rejected")).toBeInTheDocument();
    expect(screen.queryByText("Pending")).not.toBeInTheDocument();
  });

  it("shows tracking info when status is shipped with trackingId", () => {
    const order = {
      ...baseOrder,
      status: "shipped",
      trackingId: "TRACK-123",
    };
    render(<OrderDetailModal order={order} onClose={vi.fn()} />);
    expect(screen.getByText("TRACK-123")).toBeInTheDocument();
  });

  it("shows tracking info when status is delivered with trackingId", () => {
    const order = {
      ...baseOrder,
      status: "delivered",
      trackingId: "TRACK-456",
    };
    render(<OrderDetailModal order={order} onClose={vi.fn()} />);
    expect(screen.getByText("TRACK-456")).toBeInTheDocument();
  });

  it("hides tracking section when status is pending", () => {
    render(<OrderDetailModal order={baseOrder} onClose={vi.fn()} />);
    expect(screen.queryByText(/Courier Tracking ID/)).not.toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(<OrderDetailModal order={baseOrder} onClose={onClose} />);
    fireEvent.click(screen.getByText("✕"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when overlay is clicked", () => {
    const onClose = vi.fn();
    render(<OrderDetailModal order={baseOrder} onClose={onClose} />);
    const overlay = document.querySelector(".modal-overlay");
    fireEvent.click(overlay!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose when modal content is clicked", () => {
    const onClose = vi.fn();
    render(<OrderDetailModal order={baseOrder} onClose={onClose} />);
    const content = document.querySelector(".modal-content");
    fireEvent.click(content!);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onClose when Escape key is pressed", () => {
    const onClose = vi.fn();
    render(<OrderDetailModal order={baseOrder} onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose for non-Escape key press", () => {
    const onClose = vi.fn();
    render(<OrderDetailModal order={baseOrder} onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Enter" });
    fireEvent.keyDown(document, { key: "Tab" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("sets body overflow to hidden on mount", () => {
    render(<OrderDetailModal order={baseOrder} onClose={vi.fn()} />);
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("restores body overflow on unmount", () => {
    const { unmount } = render(
      <OrderDetailModal order={baseOrder} onClose={vi.fn()} />,
    );
    unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("renders admin action buttons when showActions is true", () => {
    const order = { ...baseOrder, status: "pending" };
    render(
      <OrderDetailModal
        order={order}
        onClose={vi.fn()}
        showActions
        onAdvance={vi.fn()}
        onReject={vi.fn()}
      />,
    );
    expect(screen.getByText(/Advance to/)).toBeInTheDocument();
    expect(screen.getByText("Reject Order")).toBeInTheDocument();
  });

  it("hides admin action buttons when showActions is false", () => {
    render(
      <OrderDetailModal order={baseOrder} onClose={vi.fn()} />,
    );
    expect(screen.queryByText(/Advance to/)).not.toBeInTheDocument();
    expect(screen.queryByText("Reject Order")).not.toBeInTheDocument();
  });

  it("calls onAdvance when advance button is clicked", () => {
    const onAdvance = vi.fn();
    const order = { ...baseOrder, status: "pending" };
    render(
      <OrderDetailModal
        order={order}
        onClose={vi.fn()}
        showActions
        onAdvance={onAdvance}
      />,
    );
    fireEvent.click(screen.getByText(/Advance to/));
    expect(onAdvance).toHaveBeenCalledWith("order-1");
  });

  it("calls onReject when reject button is clicked", () => {
    const onReject = vi.fn();
    const order = { ...baseOrder, status: "pending" };
    render(
      <OrderDetailModal
        order={order}
        onClose={vi.fn()}
        showActions
        onReject={onReject}
      />,
    );
    fireEvent.click(screen.getByText("Reject Order"));
    expect(onReject).toHaveBeenCalledWith("order-1");
  });

  it("shows loading overlay when isTransitioning is true", () => {
    const order = { ...baseOrder, status: "pending" };
    render(
      <OrderDetailModal
        order={order}
        onClose={vi.fn()}
        showActions
        isTransitioning
        onAdvance={vi.fn()}
      />,
    );
    expect(screen.getByText("Updating Order Status...")).toBeInTheDocument();
  });

  it("disables buttons when isTransitioning is true", () => {
    const order = { ...baseOrder, status: "pending" };
    render(
      <OrderDetailModal
        order={order}
        onClose={vi.fn()}
        showActions
        isTransitioning
        onAdvance={vi.fn()}
      />,
    );
    const advanceBtn = screen.getByText(/Advance to/);
    expect(advanceBtn).toBeDisabled();
  });

  it("hides reject button when status is not pending", () => {
    const order = { ...baseOrder, status: "approved" };
    render(
      <OrderDetailModal
        order={order}
        onClose={vi.fn()}
        showActions
        onAdvance={vi.fn()}
        onReject={vi.fn()}
      />,
    );
    expect(screen.queryByText("Reject Order")).not.toBeInTheDocument();
  });

  it("shows Advance button for pending status", () => {
    const order = { ...baseOrder, status: "pending" };
    render(
      <OrderDetailModal
        order={order}
        onClose={vi.fn()}
        showActions
        onAdvance={vi.fn()}
      />,
    );
    // For pending, next is approved
    expect(screen.getByText("Advance to Approved")).toBeInTheDocument();
  });

  it("does not show advance button when on last status", () => {
    const order = { ...baseOrder, status: "delivered" };
    render(
      <OrderDetailModal
        order={order}
        onClose={vi.fn()}
        showActions
        onAdvance={vi.fn()}
      />,
    );
    expect(screen.queryByText(/Advance to/)).not.toBeInTheDocument();
  });
});
