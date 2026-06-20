import { describe, it, expect, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn(function () {
    return { $connect: vi.fn() };
  }),
}));

vi.mock("@prisma/adapter-pg", () => ({
  PrismaPg: vi.fn(),
}));

describe("prisma", () => {
  it("exports a prisma object", async () => {
    const { prisma } = await import("../../lib/prisma");
    expect(prisma).toBeDefined();
  });

  it("lazily creates PrismaClient on property access", async () => {
    const { prisma } = await import("../../lib/prisma");
    // Proxy defers instantiation — no calls at module evaluation
    expect(PrismaPg).not.toHaveBeenCalled();
    expect(PrismaClient).not.toHaveBeenCalled();

    // Access a property — triggers lazy creation
    void (prisma as unknown as PrismaClient).$connect;
    expect(PrismaPg).toHaveBeenCalledTimes(1);
    expect(PrismaClient).toHaveBeenCalledTimes(1);
  });
});
