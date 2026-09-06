import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import AdminOrdersPanel from "@/src/components/admin/AdminOrdersPanel";
import type { Order } from "@/src/lib/api/schemas";

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "order-1",
    orderNumber: "ORD-001",
    customerName: "Ada Lovelace",
    customerEmail: "ada@example.com",
    customerPhone: "9999999999",
    status: "pending",
    totalAmount: 1234.5,
    subtotal: 1234.5,
    shippingCost: 0,
    createdAt: "2026-08-01T10:00:00.000Z",
    items: [
      {
        id: "item-1",
        productName: "Bracelet",
        unitPrice: 1234.5,
        quantity: 1,
      },
    ],
    addressLine1: "12 MG Road",
    city: "Bengaluru",
    stateCode: "KA",
    postalCode: "560001",
    ...overrides,
  } as Order;
}

const baseProps = {
  orders: [] as Order[],
  loading: false,
  statusFilter: "all",
  onStatusFilterChange: vi.fn(),
  currentPage: 1,
  totalPages: 1,
  onPageChange: vi.fn(),
  advancingOrderId: null,
  selectedOrder: null,
  onSelectOrder: vi.fn(),
  sort: "date-desc",
  onSortChange: vi.fn(),
};

describe("AdminOrdersPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders orders as table rows with required columns", () => {
    render(
      <AdminOrdersPanel
        {...baseProps}
        orders={[
          makeOrder(),
          makeOrder({ id: "order-2", orderNumber: "ORD-002", customerName: "Grace Hopper" }),
        ]}
      />,
    );
    expect(screen.getByRole("columnheader", { name: /order #/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /customer/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /items/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /total/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /status/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /date/i })).toBeInTheDocument();
    const table = within(screen.getByRole("table"));
    expect(table.getByText("ORD-001")).toBeInTheDocument();
    expect(table.getByText("Grace Hopper")).toBeInTheDocument();
  });

  it("opens the detail flow on row click", () => {
    const order = makeOrder();
    const onSelectOrder = vi.fn();
    render(<AdminOrdersPanel {...baseProps} orders={[order]} onSelectOrder={onSelectOrder} />);
    fireEvent.click(screen.getByTestId("order-row-order-1"));
    expect(onSelectOrder).toHaveBeenCalledWith(order);
  });

  it("does not open the modal while a transition is pending", () => {
    const onSelectOrder = vi.fn();
    render(
      <AdminOrdersPanel
        {...baseProps}
        orders={[makeOrder()]}
        onSelectOrder={onSelectOrder}
        advancingOrderId="order-1"
      />,
    );
    fireEvent.click(screen.getByTestId("order-row-order-1"));
    expect(onSelectOrder).not.toHaveBeenCalled();
  });

  it("header click reports the mapped sort value to onSortChange", () => {
    render(<AdminOrdersPanel {...baseProps} orders={[makeOrder()]} />);
    fireEvent.click(screen.getByRole("button", { name: /sort by total/i }));
    expect(baseProps.onSortChange).toHaveBeenCalledWith("total-asc");
  });

  it("shows skeleton rows while loading", () => {
    const { container } = render(<AdminOrdersPanel {...baseProps} orders={[]} loading />);
    expect(container.querySelectorAll(".skeleton-text").length).toBeGreaterThan(0);
    expect(screen.queryByText(/ORD-/)).not.toBeInTheDocument();
  });

  it("keeps status tab buttons functional", () => {
    render(<AdminOrdersPanel {...baseProps} orders={[makeOrder()]} />);
    fireEvent.click(screen.getByRole("button", { name: "Pending" }));
    expect(baseProps.onStatusFilterChange).toHaveBeenCalledWith("pending");
  });
});

