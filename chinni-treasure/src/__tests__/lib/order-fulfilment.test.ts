import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockPrisma, mockTx } from "@/src/__tests__/mocks/prisma";
import type { UpdateOrderStatusInput } from "@/src/lib/order-intake";
import { ORDER_STATUS_ACTIONS, ORDER_STATUS_FLOW, ORDER_STATUS_VOCABULARY } from "@/src/lib/constants";

vi.mock("@/src/lib/prisma", () => ({ prisma: createMockPrisma() }));

import {
  transitionOrderStatus,
  parseUpdateOrderStatusInput,
  validateTransition,
  setTrackingId,
  parseUpdateTrackingInput,
  OrderError,
} from "@/src/lib/order-intake";
import { prisma } from "@/src/lib/prisma";

type FlowStatus = (typeof ORDER_STATUS_FLOW)[number];

function expectRejection(current: FlowStatus, next: FlowStatus, message: string) {
  expect(validateTransition(current, next)).toContain(message);
}

const baseOrder = {
  id: "order-uuid",
  orderNumber: "ORD-TEST",
  status: "pending",
  version: 0,
  items: [
    { productId: "p1", quantity: 2 },
    { productId: "p2", quantity: 1 },
  ],
};

const updatedOrder = {
  ...baseOrder,
  status: "approved",
  version: 1,
  orderNumber: "ORD-TEST",
  items: [],
  statusHistory: [],
};

function mockFindUnique(order: typeof baseOrder | null) {
  vi.mocked(prisma.order.findUnique).mockResolvedValue(order as never);
}

describe("validateTransition", () => {
  it("allows the documented forward flow one step at a time", () => {
    expect(validateTransition("pending", "approved")).toBeNull();
    expect(validateTransition("approved", "packaging")).toBeNull();
    expect(validateTransition("packaging", "shipped")).toBeNull();
    expect(validateTransition("shipped", "delivered")).toBeNull();
  });

  it("allows rejection from any non-terminal status", () => {
    expect(validateTransition("pending", "rejected")).toBeNull();
    expect(validateTransition("approved", "rejected")).toBeNull();
    expect(validateTransition("packaging", "rejected")).toBeNull();
    expect(validateTransition("shipped", "rejected")).toBeNull();
  });

  it("blocks terminal states", () => {
    expect(validateTransition("rejected", "approved")).toContain("cannot be re-opened");
    expect(validateTransition("rejected", "rejected")).toContain("already rejected");
    expect(validateTransition("delivered", "rejected")).toContain("final");
    expect(validateTransition("delivered", "shipped")).toContain("final");
  });

  it("blocks skips and backwards moves in the forward flow", () => {
    expectRejection("pending", "shipped", "Cannot move from pending to shipped");
    expectRejection("packaging", "approved", "Cannot move from packaging to approved");
  });

  it("matches the vocabulary's allowed actions for every status", () => {
    for (const status of ORDER_STATUS_FLOW) {
      const allowed = ORDER_STATUS_ACTIONS[status];
      for (const next of allowed) {
        expect(validateTransition(status as (typeof ORDER_STATUS_FLOW)[number], next as (typeof ORDER_STATUS_FLOW)[number] | "rejected")).toBeNull();
      }
    }
    for (const status of ORDER_STATUS_VOCABULARY.flow) {
      const allStatuses = ORDER_STATUS_VOCABULARY.flow as readonly FlowStatus[];
      for (const next of allStatuses) {
        if (!ORDER_STATUS_ACTIONS[status].includes(next as (typeof ORDER_STATUS_ACTIONS)[keyof typeof ORDER_STATUS_ACTIONS])) {
          expect(validateTransition(status, next)).not.toBeNull();
        }
      }
    }
  });
});

describe("parseUpdateOrderStatusInput", () => {
  it("parses a valid transition", () => {
    expect(
      parseUpdateOrderStatusInput({ status: "approved", expectedVersion: 0 }),
    ).toMatchObject({ status: "approved" });
  });

  it("rejects an unknown status as OrderError/400", () => {
    expect(() => parseUpdateOrderStatusInput({ status: "flying" })).toThrowError(OrderError);
  });
});

describe("transitionOrderStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("transitions through the interface — no HTTP harness", async () => {
    mockFindUnique(baseOrder);
    vi.mocked(prisma.order.update).mockResolvedValue(updatedOrder as never);
    // Second findUnique call (post-transition re-read) returns the updated order.
    vi.mocked(prisma.order.findUnique)
      .mockResolvedValueOnce(baseOrder as never)
      .mockResolvedValueOnce(updatedOrder as never);

    const { previousStatus, order } = await transitionOrderStatus("order-uuid", {
      status: "approved",
      expectedVersion: 0,
    });

    expect(previousStatus).toBe("pending");
    expect(order.status).toBe("approved");
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "order-uuid" },
        data: expect.objectContaining({
          status: "approved",
          version: { increment: 1 },
        }),
      }),
    );
  });

  it("restores stock atomically when rejecting", async () => {
    mockFindUnique(baseOrder);
    vi.mocked(prisma.$transaction).mockImplementation(
      async (cb: (tx: typeof mockTx) => unknown) => cb(mockTx),
    );

    await transitionOrderStatus("order-uuid", { status: "rejected" });

    expect(mockTx.product.update).toHaveBeenCalledTimes(2);
    expect(mockTx.product.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "p1" },
        data: { stockQuantity: { increment: 2 } },
      }),
    );
    expect(mockTx.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "rejected" }),
      }),
    );
  });

  it("throws OrderError/409 on version mismatch before mutating anything", async () => {
    mockFindUnique(baseOrder);

    await expect(
      transitionOrderStatus("order-uuid", { status: "approved", expectedVersion: 99 }),
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(prisma.order.update).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("throws OrderError/400 when shipping without a tracking ID", async () => {
    mockFindUnique({ ...baseOrder, status: "packaging" });

    await expect(
      transitionOrderStatus("order-uuid", { status: "shipped" }),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringContaining("Tracking ID is required"),
    });
  });

  it("throws OrderError/400 on an illegal jump without mutating anything", async () => {
    mockFindUnique(baseOrder);

    await expect(
      transitionOrderStatus("order-uuid", { status: "delivered" }),
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  it("throws OrderError/404 for a missing order", async () => {
    mockFindUnique(null);

    await expect(
      transitionOrderStatus("nope", { status: "approved" } as UpdateOrderStatusInput),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe("setTrackingId", () => {
  it("writes trackingId with a version bump through the module", async () => {
    mockFindUnique(baseOrder);
    vi.mocked(prisma.order.update).mockResolvedValue(updatedOrder as never);
    vi.mocked(prisma.order.findUnique).mockResolvedValueOnce(baseOrder as never).mockResolvedValueOnce(updatedOrder as never);

    const order = await setTrackingId("order-uuid", {
      trackingId: "TRK-1",
      expectedVersion: 0,
    });

    expect(order.status).toBe("approved");
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "order-uuid" },
        data: { trackingId: "TRK-1", version: { increment: 1 } },
      }),
    );
  });

  it("accepts a tracking write without an expectedVersion", async () => {
    mockFindUnique(baseOrder);
    vi.mocked(prisma.order.update).mockResolvedValue(updatedOrder as never);
    vi.mocked(prisma.order.findUnique).mockResolvedValueOnce(baseOrder as never).mockResolvedValueOnce(updatedOrder as never);

    await expect(
      setTrackingId("order-uuid", { trackingId: "TRK-2" }),
    ).resolves.toMatchObject({ orderNumber: "ORD-TEST" });
  });

  it("throws OrderError/409 on a stale version without mutating", async () => {
    mockFindUnique(baseOrder);

    await expect(
      setTrackingId("order-uuid", { trackingId: "TRK-1", expectedVersion: 99 }),
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  it("throws OrderError/404 for a missing order", async () => {
    mockFindUnique(null);

    await expect(
      setTrackingId("nope", { trackingId: "TRK-1" }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe("parseUpdateTrackingInput", () => {
  it("passes trackingId and expectedVersion through", () => {
    expect(parseUpdateTrackingInput({ trackingId: "TRK-1", expectedVersion: 3 })).toEqual({
      trackingId: "TRK-1",
      expectedVersion: 3,
    });
  });

  it("throws OrderError/400 when trackingId is missing", () => {
    expect(() => parseUpdateTrackingInput({})).toThrowError(OrderError);
    try {
      parseUpdateTrackingInput({});
      expect.unreachable();
    } catch (err) {
      expect(err).toMatchObject({ statusCode: 400 });
    }
  });

  it("propagates the required-trackingId message for an empty value", () => {
    try {
      parseUpdateTrackingInput({ trackingId: "" });
      expect.unreachable();
    } catch (err) {
      expect((err as OrderError).message).toContain("Tracking ID is required");
    }
  });
});
