// @vitest-environment node
import { vi, describe, it, expect, beforeEach } from "vitest";
import { createNextRequest } from "@/src/__tests__/utils/api-test";
import { createMockPrisma } from "@/src/__tests__/mocks/prisma";

vi.mock("@/src/lib/prisma", () => ({ prisma: createMockPrisma() }));
vi.mock("bcryptjs", () => ({
  default: { compare: vi.fn() },
  compare: vi.fn(),
}));

import { prisma } from "@/src/lib/prisma";
import bcrypt from "bcryptjs";
import { POST } from "@/app/api/auth/login/route";

const mockAdmin = {
  id: "admin-uuid",
  username: "admin",
  role: "admin" as const,
  email: "admin@example.com",
  isActive: true,
  passwordHash: "$2a$10$hashedpassword",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLoginAt: null,
};

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with user data and sets session cookie for valid login", async () => {
    vi.mocked(prisma.admin.findUnique).mockResolvedValue(mockAdmin);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const req = createNextRequest("/api/auth/login", {
      method: "POST",
      body: { username: "admin", password: "correct-password" },
      headers: { "x-forwarded-for": "127.0.0.1" },
    });

    const response = await POST(req);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.username).toBe("admin");
    expect(body.role).toBe("admin");

    const setCookie = response.headers.get("Set-Cookie");
    expect(setCookie).toContain("session=");
    expect(setCookie).toContain("HttpOnly");
  });

  it("returns 401 for wrong password", async () => {
    vi.mocked(prisma.admin.findUnique).mockResolvedValue(mockAdmin);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    const req = createNextRequest("/api/auth/login", {
      method: "POST",
      body: { username: "admin", password: "wrong-password" },
      headers: { "x-forwarded-for": "127.0.0.1" },
    });

    const response = await POST(req);
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Invalid credentials");
  });

  it("returns 401 for inactive admin", async () => {
    vi.mocked(prisma.admin.findUnique).mockResolvedValue({
      ...mockAdmin,
      isActive: false,
    });

    const req = createNextRequest("/api/auth/login", {
      method: "POST",
      body: { username: "admin", password: "password" },
      headers: { "x-forwarded-for": "127.0.0.1" },
    });

    const response = await POST(req);
    expect(response.status).toBe(401);
  });

  it("returns 400 for missing username", async () => {
    const req = createNextRequest("/api/auth/login", {
      method: "POST",
      body: { password: "password" },
      headers: { "x-forwarded-for": "127.0.0.1" },
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it("returns 400 for missing password", async () => {
    const req = createNextRequest("/api/auth/login", {
      method: "POST",
      body: { username: "admin" },
      headers: { "x-forwarded-for": "127.0.0.1" },
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it("returns 429 after rate limit exceeded", async () => {
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    vi.mocked(prisma.admin.findUnique).mockResolvedValue(mockAdmin);

    for (let i = 0; i < 5; i++) {
      const req = createNextRequest("/api/auth/login", {
        method: "POST",
        body: { username: "admin", password: "password" },
        headers: { "x-forwarded-for": "rate-limited-ip" },
      });
      await POST(req);
    }

    const req = createNextRequest("/api/auth/login", {
      method: "POST",
      body: { username: "admin", password: "password" },
      headers: { "x-forwarded-for": "rate-limited-ip" },
    });

    const response = await POST(req);
    expect(response.status).toBe(429);
  });
});
