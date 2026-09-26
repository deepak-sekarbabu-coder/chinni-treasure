// @vitest-environment node
import { vi, describe, it, expect, beforeEach } from "vitest";
import { createMockPrisma } from "@/src/__tests__/mocks/prisma";

vi.mock("@/src/lib/prisma", () => createMockPrisma());

// We need to mock next/headers for getSession
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

import { cookies } from "next/headers";
import { GET } from "@/app/api/auth/me/route";
import { signToken } from "@/src/lib/auth";

describe("GET /api/auth/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns authenticated when valid session cookie exists", async () => {
    const token = await signToken({ id: "admin-id", username: "admin", role: "admin" });
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ name: "session", value: token }),
      set: vi.fn(),
      delete: vi.fn(),
    });

    const response = await GET();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.authenticated).toBe(true);
    expect(body.username).toBe("admin");
  });

  it("returns 401 when no session cookie exists", async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
      set: vi.fn(),
      delete: vi.fn(),
    });

    const response = await GET();
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.authenticated).toBe(false);
  });

  it("returns 401 for invalid session cookie", async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ name: "session", value: "invalid-token" }),
      set: vi.fn(),
      delete: vi.fn(),
    });

    const response = await GET();
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.authenticated).toBe(false);
  });
});
