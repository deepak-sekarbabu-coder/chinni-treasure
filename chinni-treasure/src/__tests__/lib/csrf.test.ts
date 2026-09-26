import { describe, it, expect, afterEach } from "vitest";
import { validateCsrfOrigin } from "../../lib/csrf";
import { createNextRequest } from "../utils/api-test";

/**
 * These tests exercise the real origin policy — no vi.mock — through the same
 * Request objects the routes receive. The dev-only localhost escape hatch is
 * covered by flipping NODE_ENV around a single case.
 */
describe("validateCsrfOrigin", () => {
  afterEach(() => {
    process.env.NODE_ENV = "test";
  });

  it("lets safe methods through without origin headers", () => {
    expect(validateCsrfOrigin(createNextRequest("/api/x"))).toBeNull();
    expect(validateCsrfOrigin(createNextRequest("/api/x", { method: "HEAD" }))).toBeNull();
    expect(validateCsrfOrigin(createNextRequest("/api/x", { method: "OPTIONS" }))).toBeNull();
  });

  it("accepts a POST whose Origin matches the host", () => {
    expect(
      validateCsrfOrigin(createNextRequest("/api/x", { method: "POST", body: {} })),
    ).toBeNull();
  });

  it("accepts a POST whose Referer matches when Origin is absent", () => {
    const req = createNextRequest("/api/x", {
      method: "POST",
      body: {},
      headers: { Origin: "", Referer: "http://localhost:3000/catalogue" },
    });
    req.headers.delete("Origin");
    expect(validateCsrfOrigin(req)).toBeNull();
  });

  it("rejects a cross-site Origin", () => {
    const res = validateCsrfOrigin(
      createNextRequest("/api/x", {
        method: "POST",
        body: {},
        headers: { Origin: "https://evil.example" },
      }),
    );
    expect(res?.status).toBe(403);
  });

  it("rejects a cross-site Referer", () => {
    const req = createNextRequest("/api/x", {
      method: "POST",
      body: {},
      headers: { Referer: "https://evil.example/form" },
    });
    req.headers.delete("Origin"); // factory default Origin would win
    expect(validateCsrfOrigin(req)?.status).toBe(403);
  });

  it("rejects a POST with no Origin and no Referer outside development", () => {
    const req = createNextRequest("/api/x", { method: "POST", body: {} });
    req.headers.delete("Origin");
    expect(validateCsrfOrigin(req)?.status).toBe(403);
  });

  it("rejects a malformed Origin", () => {
    const res = validateCsrfOrigin(
      createNextRequest("/api/x", {
        method: "POST",
        body: {},
        headers: { Origin: "null" },
      }),
    );
    expect(res?.status).toBe(403);
  });

  it("allows non-browser dev tools against localhost in development", () => {
    process.env.NODE_ENV = "development";
    expect(
      validateCsrfOrigin(
        createNextRequest("/api/x", {
          method: "POST",
          body: {},
          headers: { Origin: "http://localhost:4000" },
        }),
      ),
    ).toBeNull();
  });
});
