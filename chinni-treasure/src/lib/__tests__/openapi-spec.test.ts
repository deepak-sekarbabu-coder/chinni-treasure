import { describe, it, expect } from "vitest";
import { openApiSpec } from "../openapi-spec";

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
});
