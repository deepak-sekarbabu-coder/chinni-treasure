import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { createNextRequest } from "@/src/__tests__/utils/api-test";

vi.mock("@/src/lib/auth", () => ({
  checkAuth: vi.fn(),
}));
vi.mock("@/src/lib/csrf", () => ({
  validateCsrfOrigin: vi.fn(),
}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { checkAuth } from "@/src/lib/auth";
import { validateCsrfOrigin } from "@/src/lib/csrf";
import { revalidatePath } from "next/cache";
import { withAdmin, mapAdminRouteError, revalidateCatalogueSurfaces } from "@/src/lib/admin-route";

const mockAdmin = { id: "admin-1", username: "admin", role: "admin" as const };

function ok(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

/** A statusCode-bearing domain error, like OrderError / RazorpayGatewayError. */
class FakeDomainError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(validateCsrfOrigin).mockReturnValue(null);
  vi.mocked(checkAuth).mockResolvedValue(mockAdmin);
});

describe("withAdmin — guard order", () => {
  it("returns the CSRF rejection verbatim and never runs the handler", async () => {
    const csrfResponse = NextResponse.json({ error: "Forbidden" }, { status: 403 });
    vi.mocked(validateCsrfOrigin).mockReturnValue(csrfResponse);
    const handler = vi.fn();

    const wrapped = withAdmin(handler, { parseBody: true });
    const res = await wrapped(createNextRequest("/api/x", { method: "POST", body: {} }));

    expect(res.status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
    expect(checkAuth).not.toHaveBeenCalled();
  });

  it("returns 401 when there is no admin session and never runs the handler", async () => {
    vi.mocked(checkAuth).mockResolvedValue(null);
    const handler = vi.fn();

    const wrapped = withAdmin(handler);
    const res = await wrapped(createNextRequest("/api/x", { method: "POST", body: {} }));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
    expect(handler).not.toHaveBeenCalled();
  });

  it("runs the handler with the verified admin", async () => {
    const handler = vi.fn().mockResolvedValue(ok({ fine: true }));
    const wrapped = withAdmin(handler);

    const res = await wrapped(createNextRequest("/api/x", { method: "POST", body: {} }));

    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ admin: mockAdmin, request: expect.any(Request) }),
    );
  });
});

describe("withAdmin — body parsing", () => {
  it("parses JSON into ctx.body when parseBody is set", async () => {
    const handler = vi.fn().mockResolvedValue(ok({}));
    const wrapped = withAdmin(handler, { parseBody: true });

    await wrapped(createNextRequest("/api/x", { method: "POST", body: { a: 1 } }));

    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ body: { a: 1 } }));
  });

  it("answers 400 on invalid JSON and never runs the handler", async () => {
    const handler = vi.fn();
    const wrapped = withAdmin(handler, { parseBody: true });

    const req = createNextRequest("/api/x", { method: "POST" });
    // Raw Request with a non-JSON body.
    const bad = new Request(req.url, { method: "POST", body: "not-json{", headers: { "Content-Type": "application/json" } });
    const res = await wrapped(bad);

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid JSON body" });
    expect(handler).not.toHaveBeenCalled();
  });

  it("leaves body undefined when parseBody is not set", async () => {
    const handler = vi.fn().mockResolvedValue(ok({}));
    const wrapped = withAdmin(handler);

    await wrapped(createNextRequest("/api/x", { method: "POST", body: { a: 1 } }));

    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ body: undefined }));
  });
});

describe("withAdmin — params", () => {
  it("awaits and forwards route params", async () => {
    const handler = vi.fn().mockResolvedValue(ok({}));
    const wrapped = withAdmin<{ id: string }>(handler);

    await wrapped(createNextRequest("/api/x/id-9"), { params: Promise.resolve({ id: "id-9" }) });

    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ params: { id: "id-9" } }));
  });

  it("defaults params to an empty object for non-param routes", async () => {
    const handler = vi.fn().mockResolvedValue(ok({}));
    const wrapped = withAdmin(handler);

    await wrapped(createNextRequest("/api/x"));

    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ params: {} }));
  });
});

describe("withAdmin — error mapping", () => {
  it("maps statusCode-bearing domain errors to their own status and message", async () => {
    const wrapped = withAdmin(() => {
      throw new FakeDomainError("Order was modified", 409);
    });

    const res = await wrapped(createNextRequest("/api/x", { method: "POST", body: {} }));

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "Order was modified" });
  });

  it("maps Prisma P2025 to 404", async () => {
    const wrapped = withAdmin(() => {
      throw new Prisma.PrismaClientKnownRequestError("nope", { code: "P2025", clientVersion: "t" });
    });

    const res = await wrapped(createNextRequest("/api/x", { method: "POST", body: {} }));

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Record not found" });
  });

  it("maps Prisma P2002 to 409 with the conflicting target", async () => {
    const wrapped = withAdmin(() => {
      throw new Prisma.PrismaClientKnownRequestError("dup", {
        code: "P2002",
        clientVersion: "t",
        meta: { target: ["Product_sku_key"] },
      });
    });

    const res = await wrapped(createNextRequest("/api/x", { method: "POST", body: {} }));

    expect(res.status).toBe(409);
    expect((await res.json()).error).toContain("Product_sku_key");
  });

  it("maps unknown errors to 500 with the fallback message", async () => {
    const wrapped = withAdmin(() => {
      throw new Error("boom");
    }, { fallbackError: "Failed to update product" });

    const res = await wrapped(createNextRequest("/api/x", { method: "POST", body: {} }));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Failed to update product" });
  });
});

describe("withAdmin — catalogue revalidation", () => {
  it("revalidates the three catalogue surfaces after a 2xx when opted in", async () => {
    const wrapped = withAdmin(() => ok({}), { revalidateCatalogue: true });

    await wrapped(createNextRequest("/api/x", { method: "POST", body: {} }));

    expect(revalidatePath).toHaveBeenCalledWith("/catalogue");
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/category", "layout");
  });

  it("does not revalidate after a non-2xx response", async () => {
    const wrapped = withAdmin(() => ok({ error: "no" }, 400), { revalidateCatalogue: true });

    await wrapped(createNextRequest("/api/x", { method: "POST", body: {} }));

    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("does not revalidate when not opted in", async () => {
    const wrapped = withAdmin(() => ok({}));

    await wrapped(createNextRequest("/api/x", { method: "POST", body: {} }));

    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("standalone helpers", () => {
  it("mapAdminRouteError keeps statusCode errors first even when they are not Errors", () => {
    // Guards the duck-type: an error-like object must NOT be trusted for status.
    const res = mapAdminRouteError({ statusCode: 200, message: "fake" }, "fallback");
    expect(res.status).toBe(500);
  });

  it("revalidateCatalogueSurfaces hits the three public surfaces", () => {
    revalidateCatalogueSurfaces();
    expect(revalidatePath).toHaveBeenCalledTimes(3);
  });
});
