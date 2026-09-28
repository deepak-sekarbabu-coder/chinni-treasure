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

describe("withDbRetry", () => {
  const retryable = () => new Error("timeout exceeded when trying to connect");
  const fatal = () => new Error("Unique constraint failed");

  // The backoff is real (1s, 2s) — fake timers keep the test instant while
  // still driving the policy's delays forward.
  const run = async <T,>(
    withDbRetry: (fn: () => Promise<T>) => Promise<T>,
    fn: () => Promise<T>,
  ) => {
    vi.useFakeTimers();
    try {
      const settled = withDbRetry(fn).then(
        (value) => ({ ok: true as const, value }),
        (error: unknown) => ({ ok: false as const, error }),
      );
      // Flush the queued backoff timers, letting each rejection schedule the next.
      for (let i = 0; i < 5; i++) await vi.advanceTimersByTimeAsync(4_000);
      return settled;
    } finally {
      vi.useRealTimers();
    }
  };

  it("retries a retryable connection error and returns the eventual success", async () => {
    const { withDbRetry } = await import("../../lib/prisma");
    let calls = 0;
    const fn = vi.fn(async () => {
      if (++calls < 3) throw retryable();
      return "ok";
    });

    await expect(run(withDbRetry, fn)).resolves.toEqual({ ok: true, value: "ok" });
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("gives up after 3 attempts and rethrows the last error", async () => {
    const { withDbRetry } = await import("../../lib/prisma");
    const fn = vi.fn(async () => {
      throw retryable();
    });

    const result = await run(withDbRetry, fn);
    expect(result.ok).toBe(false);
    expect(String((result as { error: Error }).error.message)).toMatch(/timeout exceeded/);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("passes a non-retryable error straight through", async () => {
    const { withDbRetry } = await import("../../lib/prisma");
    const fn = vi.fn(async () => {
      throw fatal();
    });

    const result = await run(withDbRetry, fn);
    expect(result.ok).toBe(false);
    expect(String((result as { error: Error }).error.message)).toMatch(/Unique constraint/);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
