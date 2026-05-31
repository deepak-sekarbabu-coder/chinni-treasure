import { describe, it, expect, vi, beforeEach } from "vitest";
import { signToken, verifyToken, getSession, createSessionCookie, clearSessionCookie } from "../auth";

// We mock next/headers so getSession can read cookies
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

import { cookies } from "next/headers";

// Store original env for cleanup
const origJwtSecret = process.env.JWT_SECRET;

describe("signToken and verifyToken", () => {
  const payload = { id: "test-id", username: "admin", role: "admin" };

  it("signToken returns a string", () => {
    const token = signToken(payload);
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);
  });

  it("verifyToken returns payload for a valid token", () => {
    const token = signToken(payload);
    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.id).toBe("test-id");
    expect(decoded?.username).toBe("admin");
    expect(decoded?.role).toBe("admin");
  });

  it("verifyToken returns null for a tampered token", () => {
    const token = signToken(payload);
    const [header, body] = token.split(".");
    const tampered = `${header}.${body}.invalidsig`;
    const decoded = verifyToken(tampered);
    expect(decoded).toBeNull();
  });

  it("verifyToken returns null for garbage input", () => {
    const decoded = verifyToken("not-a-jwt-token");
    expect(decoded).toBeNull();
  });
});

describe("getSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when no session cookie exists", async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
      set: vi.fn(),
      delete: vi.fn(),
    });

    const session = await getSession();
    expect(session).toBeNull();
  });

  it("returns decoded payload when valid session cookie exists", async () => {
    const payload = { id: "admin-id", username: "admin", role: "super_admin" };
    const token = signToken(payload);

    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ name: "session", value: token }),
      set: vi.fn(),
      delete: vi.fn(),
    });

    const session = await getSession();
    expect(session).not.toBeNull();
    expect(session?.id).toBe("admin-id");
    expect(session?.username).toBe("admin");
    expect(session?.role).toBe("super_admin");
  });

  it("returns null for invalid session cookie", async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ name: "session", value: "invalid-token" }),
      set: vi.fn(),
      delete: vi.fn(),
    });

    const session = await getSession();
    expect(session).toBeNull();
  });
});

describe("createSessionCookie", () => {
  it("returns a cookie string with HttpOnly and SameSite=Lax", () => {
    const cookie = createSessionCookie("test-token");
    expect(cookie).toContain("session=test-token");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Max-Age=86400");
  });
});

describe("clearSessionCookie", () => {
  it("returns a cookie string with Max-Age=0", () => {
    const cookie = clearSessionCookie();
    expect(cookie).toContain("session=");
    expect(cookie).toContain("Max-Age=0");
    expect(cookie).toContain("HttpOnly");
  });
});
