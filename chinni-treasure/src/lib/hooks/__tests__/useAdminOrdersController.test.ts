import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("@/src/lib/hooks/useAdminMutations", () => ({
  useUpdateOrderStatus: vi.fn(),
}));

vi.mock("@/src/components/ui/ToastProvider", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

import { useUpdateOrderStatus } from "@/src/lib/hooks/useAdminMutations";
import { useAdminOrdersController } from "../useAdminOrdersController";

const mockUseUpdateOrderStatus = vi.mocked(useUpdateOrderStatus);

function makeMutation(overrides: Partial<{ isPending: boolean; mutateAsync: ReturnType<typeof vi.fn> }> = {}) {
  return {
    isPending: false,
    mutateAsync: vi.fn().mockResolvedValue({}),
    ...overrides,
  } as unknown as ReturnType<typeof useUpdateOrderStatus>;
}

const sampleOrder = {
  id: "order-1",
  orderNumber: "ORD-1",
  customerName: "Customer",
  customerEmail: "c@example.com",
  customerPhone: "1234567890",
  status: "approved" as const,
  version: 3,
  trackingId: null,
  totalAmount: 100,
  subtotal: 100,
  shippingCost: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  items: [],
  addressLine1: "1 Main",
  city: "City",
  stateCode: "MH",
  postalCode: "400001",
};

describe("useAdminOrdersController", () => {
  let mutateAsync: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mutateAsync = vi.fn().mockResolvedValue({});
    mockUseUpdateOrderStatus.mockReturnValue(makeMutation({ mutateAsync }));
  });

  it("advances to packaging without opening the tracking modal", async () => {
    const onClear = vi.fn();
    const { result } = renderHook(() =>
      useAdminOrdersController([sampleOrder], onClear),
    );

    await act(async () => {
      await result.current.handleAdvance("order-1");
    });

    expect(mutateAsync).toHaveBeenCalledWith({
      orderId: "order-1",
      input: { status: "packaging", expectedVersion: 3 },
    });
    expect(result.current.trackingModal.open).toBe(false);
  });

  it("opens the tracking modal when advancing to shipped", async () => {
    const { result } = renderHook(() =>
      useAdminOrdersController(
        [{ ...sampleOrder, status: "packaging" as const }],
        vi.fn(),
      ),
    );

    await act(async () => {
      await result.current.handleAdvance("order-1");
    });

    expect(result.current.trackingModal).toEqual({ orderId: "order-1", open: true });
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("submits the tracking id and closes the modal", async () => {
    const { result } = renderHook(() =>
      useAdminOrdersController(
        [{ ...sampleOrder, status: "packaging" as const }],
        vi.fn(),
      ),
    );

    await act(async () => {
      await result.current.handleAdvance("order-1");
    });
    await act(async () => {
      await result.current.handleTrackingSubmit("TRK-001");
    });

    expect(mutateAsync).toHaveBeenCalledWith({
      orderId: "order-1",
      input: { status: "shipped", trackingId: "TRK-001", expectedVersion: 3 },
    });
    expect(result.current.trackingModal.open).toBe(false);
  });

  it("rejects an order and clears the selection", async () => {
    const onClear = vi.fn();
    const { result } = renderHook(() =>
      useAdminOrdersController([sampleOrder], onClear),
    );

    await act(async () => {
      await result.current.handleReject("order-1");
    });

    expect(mutateAsync).toHaveBeenCalledWith({
      orderId: "order-1",
      input: { status: "rejected", expectedVersion: 3 },
    });
    expect(onClear).toHaveBeenCalled();
  });

  it("ignores unknown orders", async () => {
    const { result } = renderHook(() =>
      useAdminOrdersController([sampleOrder], vi.fn()),
    );

    await act(async () => {
      await result.current.handleAdvance("missing");
    });

    expect(mutateAsync).not.toHaveBeenCalled();
  });
});
