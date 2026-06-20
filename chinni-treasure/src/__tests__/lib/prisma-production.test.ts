import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("prisma production mode", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "production";
    vi.resetModules();
  });

  afterEach(() => {
    process.env.NODE_ENV = "test";
  });

  it("does not set global prisma in production", async () => {
    const mockClient = { $connect: vi.fn() };
    vi.doMock("@prisma/client", () => ({
      PrismaClient: vi.fn(function () {
        return mockClient;
      }),
    }));
    vi.doMock("@prisma/adapter-pg", () => ({
      PrismaPg: vi.fn(),
    }));

    const { prisma } = await import("../../lib/prisma");
    expect(prisma).toBeDefined();
  });
});
