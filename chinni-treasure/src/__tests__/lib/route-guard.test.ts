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
vi.mock("@/src/lib/rate-limiter", () => ({
  guardRateLimit: vi.fn(),
}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));
vi.mock("@/src/lib/catalogue-cache", () => ({
  invalidateCatalogCaches: vi.fn(),
}));

import { checkAuth } from "@/src/lib/auth";
import { validateCsrfOrigin } from "@/src/lib/csrf";
import { guardRateLimit } from "@/src/lib/rate-limiter";
import { revalidatePath } from "next/cache";
import { invalidateCatalogCaches } from "@/src/lib/catalogue-cache";
import { withAdmin, withPublic, requireAdmin, mapRouteError } from "@/src/lib/route-guard";

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
  vi.mocked(guardRateLimit).mockResolvedValue(null);
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

describe("withPublic — guard order", () => {
  it("returns the CSRF rejection verbatim and never runs the handler", async () => {
    const csrfResponse = NextResponse.json({ error: "Forbidden" }, { status: 403 });
    vi.mocked(validateCsrfOrigin).mockReturnValue(csrfResponse);
    const handler = vi.fn();

    const wrapped = withPublic(handler);
    const res = await wrapped(createNextRequest("/api/x", { method: "POST", body: {} }));

    expect(res.status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
  });

  it("needs no session", async () => {
    vi.mocked(checkAuth).mockResolvedValue(null);
    const handler = vi.fn().mockResolvedValue(ok({ fine: true }));

    const wrapped = withPublic(handler);
    const res = await wrapped(createNextRequest("/api/x", { method: "POST", body: {} }));

    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ request: expect.any(Request), params: {} }),
    );
  });

  it("applies the named rate-limit policy before the handler and returns its 429", async () => {
    const limited = NextResponse.json(
      { error: "Too many order attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
    vi.mocked(guardRateLimit).mockResolvedValue(limited);
    const handler = vi.fn();

    const wrapped = withPublic(handler, { rateLimit: "order", parseBody: true });
    const res = await wrapped(createNextRequest("/api/x", { method: "POST", body: {} }));

    expect(res.status).toBe(429);
    expect(guardRateLimit).toHaveBeenCalledWith("order", expect.any(Request));
    expect(handler).not.toHaveBeenCalled();
  });

  it("does not rate limit when no policy is declared", async () => {
    const handler = vi.fn().mockResolvedValue(ok({}));
    const wrapped = withPublic(handler);

    await wrapped(createNextRequest("/api/x", { method: "POST", body: {} }));

    expect(guardRateLimit).not.toHaveBeenCalled();
  });

  it("parses the body for a public write and 400s invalid JSON", async () => {
    const handler = vi.fn().mockResolvedValue(ok({}));
    const wrapped = withPublic(handler, { parseBody: true });

    await wrapped(createNextRequest("/api/x", { method: "POST", body: { a: 1 } }));
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ body: { a: 1 } }));

    const bad = new Request("http://localhost:3000/api/x", {
      method: "POST",
      body: "not-json{",
      headers: { "Content-Type": "application/json" },
    });
    const res = await wrapped(bad);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid JSON body" });
  });
});

describe("error mapping", () => {
  it("maps statusCode-bearing domain errors to their own status and message", async () => {
    const wrapped = withPublic(() => {
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

  it("maps Prisma P2034 (serialization conflict) to 409 for either audience", async () => {
    // The drift this guards against: placement answered 409 while an admin
    // fulfilment answered 500, because only one copy knew the code.
    const failure = () => {
      throw new Prisma.PrismaClientKnownRequestError("conflict", {
        code: "P2034",
        clientVersion: "t",
      });
    };

    const publicRes = await withPublic(failure, { fallbackError: "Failed to create order" })(
      createNextRequest("/api/x", { method: "POST", body: {} }),
    );
    expect(publicRes.status).toBe(409);
    expect(await publicRes.json()).toEqual({ error: "Conflict detected. Please retry." });

    const adminRes = await withAdmin(failure, {
      fallbackError: "Failed to update order status",
      errorMessages: { p2034: "Conflict detected. Please retry your order." },
    })(createNextRequest("/api/x", { method: "POST", body: {} }));
    expect(adminRes.status).toBe(409);
    expect(await adminRes.json()).toEqual({ error: "Conflict detected. Please retry your order." });
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
  it("clears the catalogue caches and revalidates the three surfaces after a 2xx", async () => {
    const wrapped = withAdmin(() => ok({}), { revalidateCatalogue: true });

    await wrapped(createNextRequest("/api/x", { method: "POST", body: {} }));

    expect(invalidateCatalogCaches).toHaveBeenCalledTimes(1);
    expect(revalidatePath).toHaveBeenCalledWith("/catalogue");
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/category", "layout");
  });

  it("does not revalidate after a non-2xx response", async () => {
    const wrapped = withAdmin(() => ok({ error: "no" }, 400), { revalidateCatalogue: true });

    await wrapped(createNextRequest("/api/x", { method: "POST", body: {} }));

    expect(invalidateCatalogCaches).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("does not revalidate when not opted in", async () => {
    const wrapped = withAdmin(() => ok({}));

    await wrapped(createNextRequest("/api/x", { method: "POST", body: {} }));

    expect(invalidateCatalogCaches).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("requireAdmin — the hybrid routes' session refusal", () => {
  it("returns the verified session", async () => {
    expect(await requireAdmin()).toEqual(mockAdmin);
  });

  it("returns the shared 401 when there is none", async () => {
    vi.mocked(checkAuth).mockResolvedValue(null);

    const res = await requireAdmin();

    expect(res).toBeInstanceOf(NextResponse);
    expect((res as NextResponse).status).toBe(401);
    expect(await (res as NextResponse).json()).toEqual({ error: "Unauthorized" });
  });
});

describe("standalone helpers", () => {
  it("mapRouteError keeps statusCode errors first even when they are not Errors", () => {
    // Guards the duck-type: an error-like object must NOT be trusted for status.
    const res = mapRouteError({ statusCode: 200, message: "fake" }, "fallback");
    expect(res.status).toBe(500);
  });
});
