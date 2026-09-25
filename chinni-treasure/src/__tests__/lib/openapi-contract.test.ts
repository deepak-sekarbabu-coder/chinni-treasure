import { describe, it, expect } from "vitest";
import { ProductBadge } from "@prisma/client";
import { openApiSpec } from "../../lib/openapi-spec";
import { ProductsResponseSchema, SessionSchema, TrackOrdersResponseSchema } from "../../lib/api/schemas";
import { ORDER_STATUS_ALL } from "../../lib/constants";

/** Walk the spec's JSON by key path — keeps the assertions typed without `any`. */
const at = (node: unknown, ...keys: Array<string | number>): unknown =>
  keys.reduce<unknown>(
    (acc, key) => (acc as Record<string | number, unknown>)[key],
    node,
  );

const json = (path: string, method: string, status = "200"): unknown =>
  at(
    openApiSpec,
    "paths",
    path,
    method,
    "responses",
    status,
    "content",
    "application/json",
    "schema",
  );

const requestBody = (path: string, method: string): unknown =>
  at(
    openApiSpec,
    "paths",
    path,
    method,
    "requestBody",
    "content",
    "application/json",
    "schema",
  );

/** Every `enum` in the spec — drift hides in the copies, so sweep them all. */
function findEnums(node: unknown, out: string[][] = []): string[][] {
  if (Array.isArray(node)) {
    node.forEach((value) => findEnums(value, out));
  } else if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node)) {
      if (key === "enum" && Array.isArray(value)) out.push(value as string[]);
      else findEnums(value, out);
    }
  }
  return out;
}

/**
 * The spec is generated from the Zod contract; these assertions pin the
 * documented shapes back to that contract so a hand-typed edit (the drift
 * this file replaces) fails here instead of shipping.
 */
describe("docs contract: spec vs Zod schemas", () => {
  it("documents GET /api/products as the paged envelope the route returns", () => {
    const schema = json("/api/products", "get");
    expect(at(schema, "type")).toBe("object");
    expect(Object.keys(at(schema, "properties") as object).sort()).toEqual(
      Object.keys(ProductsResponseSchema.shape).sort(),
    );
  });

  it("documents GET /api/track as the tracked-order array the client parses", () => {
    const itemSchema = at(json("/api/track", "get"), "items");
    expect(at(itemSchema, "type")).toBe("object");
    expect(Object.keys(at(itemSchema, "properties") as object).sort()).toEqual(
      Object.keys(TrackOrdersResponseSchema.element.shape).sort(),
    );
  });

  it("documents every status the schema accepts", () => {
    expect(
      at(requestBody("/api/orders/{id}/status", "patch"), "properties", "status", "enum"),
    ).toEqual([...ORDER_STATUS_ALL]);
  });

  it("enumerates the full status vocabulary wherever status is listed", () => {
    const statuses = findEnums(openApiSpec).filter((enumValue) =>
      enumValue.includes("pending"),
    );
    expect(statuses.length).toBeGreaterThan(0);
    for (const status of statuses) expect(status).toEqual([...ORDER_STATUS_ALL]);
  });

  it("documents the session role as an enum, not a plain string", () => {
    const role = [...SessionSchema.shape.role.options];
    expect(at(json("/api/auth/me", "get"), "properties", "role", "enum")).toEqual(role);
    expect(at(json("/api/auth/login", "post"), "properties", "role", "enum")).toEqual(role);
  });

  it("documents one badge vocabulary, sourced from the database enum", () => {
    const badges = findEnums(openApiSpec).filter((enumValue) =>
      enumValue.includes("bestseller"),
    );
    expect(badges.length).toBeGreaterThan(0);
    for (const badge of badges) expect(badge).toEqual(Object.values(ProductBadge));
  });
});
