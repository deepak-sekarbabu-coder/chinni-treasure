import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { openApiSpec } from "../../lib/openapi-spec";

describe("openApiSpec", () => {
  it("exports a valid OpenAPI spec object", () => {
    expect(openApiSpec).toBeDefined();
    expect(typeof openApiSpec).toBe("object");
  });

  it("has correct top-level properties", () => {
    expect(openApiSpec).toHaveProperty("openapi", "3.0.3");
    expect(openApiSpec).toHaveProperty("info");
    expect(openApiSpec).toHaveProperty("paths");
    expect(openApiSpec).toHaveProperty("components");
    expect(openApiSpec).toHaveProperty("servers");
    expect(openApiSpec).toHaveProperty("tags");
  });

  it("has info with title and version", () => {
    expect(openApiSpec.info).toHaveProperty("title", "Chinni Treasure API");
    expect(openApiSpec.info).toHaveProperty("version", "1.0.0");
  });

  it("has all expected API paths", () => {
    const paths = openApiSpec.paths;
    expect(paths).toHaveProperty("/api/auth/login");
    expect(paths).toHaveProperty("/api/auth/logout");
    expect(paths).toHaveProperty("/api/auth/me");
    expect(paths).toHaveProperty("/api/products");
    expect(paths).toHaveProperty("/api/products/{id}");
    expect(paths).toHaveProperty("/api/orders");
    expect(paths).toHaveProperty("/api/orders/{id}");
    expect(paths).toHaveProperty("/api/orders/{id}/status");
    expect(paths).toHaveProperty("/api/stats");
    expect(paths).toHaveProperty("/api/track");
  });

  it("has all expected tags", () => {
    const tagNames = openApiSpec.tags.map((t) => t.name);
    expect(tagNames).toContain("Authentication");
    expect(tagNames).toContain("Products");
    expect(tagNames).toContain("Orders");
    expect(tagNames).toContain("Tracking");
    expect(tagNames).toContain("Analytics");
  });

  it("has components with security scheme and schemas", () => {
    expect(openApiSpec.components).toHaveProperty("securitySchemes");
    expect(openApiSpec.components).toHaveProperty("schemas");
    expect(openApiSpec.components.securitySchemes).toHaveProperty("sessionCookie");
    expect(openApiSpec.components.schemas).toHaveProperty("Product");
    expect(openApiSpec.components.schemas).toHaveProperty("Order");
    expect(openApiSpec.components.schemas).toHaveProperty("OrderDetail");
  });

  it("defines the session cookie as apiKey type", () => {
    const scheme = openApiSpec.components.securitySchemes.sessionCookie;
    expect(scheme).toHaveProperty("type", "apiKey");
    expect(scheme).toHaveProperty("in", "cookie");
    expect(scheme).toHaveProperty("name", "session");
  });

  it("documents every HTTP method every API route actually exports", () => {
    // The docs and the routes had no link: `PATCH /api/orders/{id}/tracking`
    // shipped undocumented (with a schema ready to generate it from) and nothing
    // noticed. This walks the route tree instead of restating a path list, so a
    // newly added route fails here until it is documented.
    const documented = new Set(
      Object.entries(openApiSpec.paths).flatMap(([path, item]) =>
        Object.keys(item as Record<string, unknown>)
          .filter((key) => HTTP_METHODS.has(key))
          .map((method) => `${method.toUpperCase()} ${path}`),
      ),
    );

    const missing = routeOperations()
      .filter((operation) => !documented.has(operation))
      .filter((operation) => !OPERATIONAL_ROUTES.has(operation))
      .sort();
    expect(missing).toEqual([]);
  });
});

const HTTP_METHODS = new Set(["get", "post", "put", "patch", "delete"]);

/**
 * Routes that exist to serve machines or operators, not API consumers, so
 * documenting them in a JSON API spec would be noise: the docs viewer itself,
 * the Vercel cron keep-alive, the health probes, and the admin spreadsheet
 * export (a blob download, not a JSON contract). Naming them here is the point —
 * a new operational route has to be declared, not silently skipped.
 */
const OPERATIONAL_ROUTES = new Set([
  "GET /api/docs",
  "GET /api/cron/db-health",
  "GET /api/health/db",
  "GET /api/health/redis",
  "GET /api/export",
]);

/**
 * Every `(METHOD, /api/... path)` a route file exports, derived from the
 * directory tree: `[id]` becomes `{id}`, and a `(method)` route-group segment
 * like `app/api/cron/(protected)` carries no path segment.
 */
function routeOperations(): string[] {
  const appDir = path.resolve(__dirname, "../../../app/api");
  const operations: string[] = [];

  const walk = (dir: string, segments: string[]): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        const name = entry.name;
        if (name.startsWith("(") && name.endsWith(")")) walk(path.join(dir, name), segments);
        else walk(path.join(dir, name), [...segments, name.replace(/\[(\w+)\]/g, "{$1}")]);
      } else if (entry.name === "route.ts") {
        const source = readFileSync(path.join(dir, entry.name), "utf8");
        const routePath = `/api/${segments.join("/")}`;
        for (const [, method] of source.matchAll(
          /export\s+(?:const|async\s+function)\s+(GET|POST|PUT|PATCH|DELETE)\b/g,
        )) {
          operations.push(`${method} ${routePath}`);
        }
      }
    }
  };

  walk(appDir, []);
  return operations;
}
