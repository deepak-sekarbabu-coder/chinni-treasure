import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockPrisma } from "@/src/__tests__/mocks/prisma";

vi.mock("@/src/lib/prisma", () => ({ prisma: createMockPrisma() }));

import { prisma } from "@/src/lib/prisma";
import { listOrdersForAdmin, buildTrackCacheKey } from "@/src/lib/order-read";

const base = { status: "pending", orderBy: { createdAt: "desc" }, skip: 0, take: 20 };

describe("listOrdersForAdmin", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the rows and the total for the same where clause", async () => {
    vi.mocked(prisma.order.findMany).mockResolvedValue([]);
    vi.mocked(prisma.order.count).mockResolvedValue(25);

    const result = await listOrdersForAdmin({ ...base, status: "pending" });

    expect(result).toEqual({ orders: [], total: 25 });
    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: "pending" },
        include: { items: { include: { product: true } } },
        skip: 0,
        take: 20,
      }),
    );
    expect(prisma.order.count).toHaveBeenCalledWith({ where: { status: "pending" } });
  });

  it("drops the status filter when none is given", async () => {
    vi.mocked(prisma.order.findMany).mockResolvedValue([]);
    vi.mocked(prisma.order.count).mockResolvedValue(0);

    await listOrdersForAdmin({ status: undefined, orderBy: base.orderBy, skip: 0, take: 20 });

    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
  });

  it("passes the requested window and order through", async () => {
    vi.mocked(prisma.order.findMany).mockResolvedValue([]);
    vi.mocked(prisma.order.count).mockResolvedValue(0);

    await listOrdersForAdmin({
      ...base,
      orderBy: { totalAmount: "desc" },
      skip: 5,
      take: 5,
    });

    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { totalAmount: "desc" }, skip: 5, take: 5 }),
    );
  });
});

describe("buildTrackCacheKey", () => {
  it("keys on the order id when given, digits-only phone otherwise", () => {
    expect(buildTrackCacheKey("ORD-1", "999-999-9999")).toBe("o:ORD-1");
    expect(buildTrackCacheKey(null, "999-999-9999")).toBe("p:9999999999");
    expect(buildTrackCacheKey(null, null)).toBeNull();
  });
});