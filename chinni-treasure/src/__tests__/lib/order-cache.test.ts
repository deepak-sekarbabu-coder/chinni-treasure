import { vi, describe, it, expect, beforeEach } from "vitest";
import { createMockRedis } from "@/src/__tests__/mocks/redis";
import { createMockPrisma } from "@/src/__tests__/mocks/prisma";

vi.mock("@/src/lib/redis", () => ({ redis: createMockRedis() }));
vi.mock("@/src/lib/prisma", () => ({ prisma: createMockPrisma() }));

import { redis } from "@/src/lib/redis";
import { prisma } from "@/src/lib/prisma";
import { invalidateOrderCache, getOrderDetail } from "@/src/lib/order-cache";

const mockRedis = redis as unknown as ReturnType<typeof createMockRedis>;

const mockOrder = {
  id: "order-1",
  orderNumber: "ORD-TEST",
  customerName: "Test User",
  status: "pending",
  subtotal: 100,
  createdAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
  items: [],
  statusHistory: [],
};

describe("invalidateOrderCache", () => {
  beforeEach(() => {
    mockRedis.reset();
    vi.clearAllMocks();
  });

  it("deletes the order key, every tracking key, and order-derived stats", async () => {
    mockRedis.store.set("order:order-1", "{}");
    mockRedis.store.set("order:order-2", "{}");
    mockRedis.store.set("track:o:order-1", "[]");
    mockRedis.store.set("track:p:9999999999", "[]");
    mockRedis.store.set("stats:stats", "{}");
    mockRedis.store.set("products:p1", "{}");

    await invalidateOrderCache("order-1");

    expect(mockRedis.store.has("order:order-1")).toBe(false);
    expect(mockRedis.store.has("order:order-2")).toBe(true);
    expect(mockRedis.store.has("track:o:order-1")).toBe(false);
    expect(mockRedis.store.has("track:p:9999999999")).toBe(false);
    expect(mockRedis.store.has("stats:stats")).toBe(false);
    expect(mockRedis.store.has("products:p1")).toBe(true);
  });

  it("still clears tracking keys and stats when no order id is given", async () => {
    mockRedis.store.set("track:p:9999999999", "[]");
    mockRedis.store.set("stats:stats", "{}");
    await invalidateOrderCache();
    expect(mockRedis.store.has("track:p:9999999999")).toBe(false);
    expect(mockRedis.store.has("stats:stats")).toBe(false);
  });

  it("resolves without throwing when del fails", async () => {
    mockRedis.setFail("del", true);
    await expect(invalidateOrderCache("order-1")).resolves.toBeUndefined();
  });
});

describe("getOrderDetail", () => {
  beforeEach(() => {
    mockRedis.reset();
    vi.clearAllMocks();
  });

  it("serves a cached order without touching prisma", async () => {
    mockRedis.store.set("order:order-1", JSON.stringify(mockOrder));

    const order = await getOrderDetail("order-1");

    expect(order?.id).toBe("order-1");
    expect(prisma.order.findUnique).not.toHaveBeenCalled();
  });

  it("fetches and caches on a miss; returns null when prisma finds nothing", async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue({ ...mockOrder, createdAt: new Date() });

    const order = await getOrderDetail("order-1");
    expect(order?.orderNumber).toBe("ORD-TEST");
    expect(mockRedis.store.has("order:order-1")).toBe(true);

    vi.mocked(prisma.order.findUnique).mockResolvedValue(null);
    expect(await getOrderDetail("order-missing")).toBeNull();
    expect(mockRedis.store.has("order:order-missing")).toBe(false);
  });
});
