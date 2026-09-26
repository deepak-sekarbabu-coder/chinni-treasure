import { describe, it, expect, vi, afterEach } from "vitest";
import { apiFetch, ApiError, NetworkError, ValidationError, getErrorMessage } from "@/src/lib/api/client";
import { z } from "zod";

const ORIGINAL_FETCH = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH;
  vi.restoreAllMocks();
});

describe("apiFetch", () => {
  it("parses JSON responses and returns them", async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ hello: "world" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const result = await apiFetch<{ hello: string }>("/api/test");
    expect(result).toEqual({ hello: "world" });
  });

  it("returns undefined for 204 No Content", async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce(new Response(null, { status: 204 }));
    const result = await apiFetch("/api/test");
    expect(result).toBeUndefined();
  });

  it("returns blob when responseType is blob", async () => {
    const blob = new Blob(["xlsx-data"], { type: "application/octet-stream" });
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      new Response(blob, { status: 200, headers: { "Content-Type": "application/octet-stream" } }),
    );
    const result = await apiFetch<Blob>("/api/export", { responseType: "blob" });
    expect(result).toBeInstanceOf(Blob);
  });

  it("throws ApiError with status and body on non-2xx", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }),
    );
    let caught: unknown;
    try {
      await apiFetch("/api/test");
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(ApiError);
    expect((caught as ApiError).status).toBe(403);
    expect((caught as ApiError).message).toBe("Forbidden");
  });

  it("throws ValidationError when schema validation fails", async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ not: "matching" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const schema = z.object({ name: z.string() });
    await expect(apiFetch("/api/test", { schema })).rejects.toBeInstanceOf(ValidationError);
  });

  it("throws NetworkError on fetch failure", async () => {
    globalThis.fetch = vi.fn().mockRejectedValueOnce(new Error("socket hang up"));
    await expect(apiFetch("/api/test")).rejects.toBeInstanceOf(NetworkError);
  });

  it("propagates AbortError without wrapping in NetworkError", async () => {
    const abortError = new DOMException("aborted", "AbortError");
    globalThis.fetch = vi.fn().mockRejectedValueOnce(abortError);
    const controller = new AbortController();
    controller.abort();
    await expect(
      apiFetch("/api/test", { signal: controller.signal }),
    ).rejects.toBeInstanceOf(DOMException);
  });

  it("includes Content-Type for JSON bodies", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    globalThis.fetch = fetchMock;
    await apiFetch("/api/test", { method: "POST", body: { foo: "bar" } });
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get("Content-Type")).toBe("application/json");
  });
});

describe("getErrorMessage", () => {
  it("reads Error and ApiError messages", () => {
    expect(getErrorMessage(new Error("boom"))).toBe("boom");
    expect(getErrorMessage(new ApiError("nope", 400))).toBe("nope");
  });

  it("reads plain { message } objects and falls back otherwise", () => {
    expect(getErrorMessage({ message: "rate limited" }, "fb")).toBe("rate limited");
    expect(getErrorMessage("oops", "fb")).toBe("fb");
    expect(getErrorMessage(null)).toBe("Something went wrong");
  });
});
