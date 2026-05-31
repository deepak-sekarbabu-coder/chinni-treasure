import { describe, it, expect, vi } from "vitest";

// Mock PrismaPg and PrismaClient to avoid needing a real DB connection
const mockPrismaClient = { $connect: vi.fn() };
const mockPrismaPg = vi.fn();

vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn(function () {
    return mockPrismaClient;
  }),
}));

vi.mock("@prisma/adapter-pg", () => ({
  PrismaPg: mockPrismaPg,
}));

describe("prisma", () => {
  it("exports a prisma object", async () => {
    const { prisma } = await import("../prisma");
    expect(prisma).toBeDefined();
  });

  it("creates a PrismaClient instance", async () => {
    const { prisma } = await import("../prisma");
    // PrismaClient constructor should have been called
    expect(prisma).toBe(mockPrismaClient);
  });
});
