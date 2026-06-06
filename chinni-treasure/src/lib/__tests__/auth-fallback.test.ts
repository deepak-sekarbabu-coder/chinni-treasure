// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("JWT_SECRET fallback", () => {
  const origSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    delete process.env.JWT_SECRET;
    vi.resetModules();
  });

  afterEach(() => {
    process.env.JWT_SECRET = origSecret;
  });

  it("uses dev-secret fallback when JWT_SECRET is not set", async () => {
    const { signToken, verifyToken } = await import("../auth");
    const token = await signToken({ id: "test-fallback" });
    expect(typeof token).toBe("string");
    const decoded = await verifyToken(token);
    expect(decoded?.id).toBe("test-fallback");
  });

  it("verifyToken works with fallback secret", async () => {
    const { signToken, verifyToken } = await import("../auth");
    const token = await signToken({ id: "test" });
    const decoded = await verifyToken(token);
    expect(decoded).not.toBeNull();
  });
});
