import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { checkRateLimit } from "../../lib/rate-limiter";

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows the first 5 requests within the window", async () => {
    for (let i = 0; i < 5; i++) {
      const result = await checkRateLimit("test-key");
      expect(result.allowed).toBe(true);
    }
  });

  it("blocks the 6th request within the window", async () => {
    for (let i = 0; i < 5; i++) {
      await checkRateLimit("test-key");
    }
    const result = await checkRateLimit("test-key");
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("resets after the window expires", async () => {
    for (let i = 0; i < 5; i++) {
      await checkRateLimit("test-key");
    }
    // 6th should be blocked
    expect((await checkRateLimit("test-key")).allowed).toBe(false);

    // Advance past the 60s window
    vi.advanceTimersByTime(60_001);

    // Should be allowed again
    expect((await checkRateLimit("test-key")).allowed).toBe(true);
  });

  it("tracks different keys independently", async () => {
    for (let i = 0; i < 5; i++) {
      await checkRateLimit("user-a");
    }
    // user-a is blocked
    expect((await checkRateLimit("user-a")).allowed).toBe(false);

    // user-b is still allowed
    expect((await checkRateLimit("user-b")).allowed).toBe(true);
  });

  it("reports remaining attempts", async () => {
    const first = await checkRateLimit("remaining-key");
    expect(first.remaining).toBe(4);

    await checkRateLimit("remaining-key");
    await checkRateLimit("remaining-key");
    const fourth = await checkRateLimit("remaining-key");
    expect(fourth.remaining).toBe(1);
  });

  it("supports a custom maxAttempts limit", async () => {
    // Limit of 2 attempts
    expect((await checkRateLimit("custom-key", 2)).allowed).toBe(true);
    expect((await checkRateLimit("custom-key", 2)).allowed).toBe(true);
    expect((await checkRateLimit("custom-key", 2)).allowed).toBe(false);
  });
});
