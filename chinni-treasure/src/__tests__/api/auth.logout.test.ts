import { vi, describe, it, expect, beforeEach } from "vitest";
import { createNextRequest } from "@/src/__tests__/utils/api-test";
import { createMockPrisma } from "@/src/__tests__/mocks/prisma";

vi.mock("@/src/lib/prisma", () => createMockPrisma());

import { POST } from "@/app/api/auth/logout/route";

describe("POST /api/auth/logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with success and clears session cookie", async () => {
    const response = await POST(createNextRequest("/api/auth/logout", { method: "POST" }));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);

    const setCookie = response.headers.get("Set-Cookie");
    expect(setCookie).toContain("Max-Age=0");
  });
});
