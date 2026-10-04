import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAdminOrdersPanel } from "@/src/components/admin/useAdminOrdersPanel";
import { ADMIN_PAGE_SIZES } from "@/src/lib/hooks/useAdminData";
import type { Order } from "@/src/lib/api/schemas";

const order = (over: Partial<Order> = {}): Order =>
  ({
    id: "order-1",
    orderNumber: "ORD-001",
    customerName: "Ada",
    status: "approved",
    version: 7,
    totalAmount: 400,
    subtotal: 200,
    shippingCost: 200,
    ...over,
  }) as Order;

const useAdminOrders = vi.fn();
const updateStatus = vi.fn();
const updateTracking = vi.fn();
const showToast = vi.fn();

vi.mock("@/src/lib/hooks/useAdminData", () => ({
  ADMIN_PAGE_SIZES: { orders: 10 },
  useAdminOrders: (...args: unknown[]) => useAdminOrders(...args),
}));

vi.mock("@/src/lib/hooks/useAdminMutations", () => ({
  useUpdateOrderStatus: () => ({ mutateAsync: updateStatus, isPending: false }),
  useUpdateTrackingId: () => ({ mutateAsync: updateTracking, isPending: false }),
}));

vi.mock("@/src/components/ui/ToastProvider", () => ({
  useToast: () => ({ showToast }),
}));

const query = (data?: { orders: Order[]; totalPages: number }) => ({
  data,
  isLoading: false,
  isFetching: false,
});

function setup(args: { selectedOrderId?: string | null } = {}) {
  const setSelectedOrderId = vi.fn();
  const clearSelectedOrder = vi.fn();
  const { result } = renderHook(() =>
    useAdminOrdersPanel({
      authenticated: true,
      selectedOrderId: args.selectedOrderId ?? null,
      setSelectedOrderId,
      clearSelectedOrder,
    }),
  );
  return { result, setSelectedOrderId, clearSelectedOrder };
}

beforeEach(() => {
  vi.clearAllMocks();
  updateStatus.mockResolvedValue({});
  useAdminOrders.mockReturnValue(query({ orders: [order()], totalPages: 3 }));
});

describe("useAdminOrdersPanel", () => {
  it("queries the panel's page with the shared admin page size", () => {
    setup();
    expect(useAdminOrders).toHaveBeenCalledWith(
      { page: 1, limit: ADMIN_PAGE_SIZES.orders, status: "all", sort: "date-desc" },
      true,
    );
  });

  it("resolves the selected order out of the fetched page", () => {
    const { result } = setup({ selectedOrderId: "order-1" });
    expect(result.current.data.selectedOrder?.orderNumber).toBe("ORD-001");
  });

  it("reports no selected order for an id that is not on this page", () => {
    const { result } = setup({ selectedOrderId: "order-99" });
    expect(result.current.data.selectedOrder).toBeNull();
  });

  it("changing the status filter goes back to page 1", () => {
    const { result } = setup();
    act(() => result.current.actions.onPageChange(3));
    expect(useAdminOrders).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 3 }),
      true,
    );
    act(() => result.current.actions.onStatusFilterChange("shipped"));
    expect(useAdminOrders).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1, status: "shipped" }),
      true,
    );
  });

  it("sorting forwards the sort key", () => {
    const { result } = setup();
    act(() => result.current.actions.onSortChange("total-asc"));
    expect(useAdminOrders).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1, sort: "total-asc" }),
      true,
    );
  });

  // The controller's actions reach the panel through the view-model; this is
  // that forwarding, at the seam the panel consumes.
  it("advancing an order posts the next status with its version", async () => {
    const { result } = setup();
    await act(async () => {
      await result.current.actions.handleAdvance("order-1");
    });
    expect(updateStatus).toHaveBeenCalledWith({
      orderId: "order-1",
      input: { status: "packaging", expectedVersion: 7 },
    });
  });

  it("advancing to shipped opens the tracking modal instead of posting", async () => {
    useAdminOrders.mockReturnValue(query({ orders: [order({ status: "packaging" })], totalPages: 1 }));
    const { result } = setup();
    await act(async () => {
      await result.current.actions.handleAdvance("order-1");
    });
    expect(updateStatus).not.toHaveBeenCalled();
    expect(result.current.data.trackingModal).toEqual({ orderId: "order-1", open: true });
  });

  it("selecting an order hands the id back to the page aggregate", () => {
    const { result, setSelectedOrderId } = setup();
    act(() => result.current.actions.onSelectOrder(order({ id: "order-2" })));
    expect(setSelectedOrderId).toHaveBeenCalledWith("order-2");
  });
});