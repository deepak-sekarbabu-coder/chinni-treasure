import { describe, it, expect } from "vitest";
import { createMockCookies } from "../next-headers";

describe("createMockCookies", () => {
  it("returns a mock function", () => {
    const mock = createMockCookies();
    expect(typeof mock).toBe("function");
    expect(mock.mock).toBeDefined();
  });

  it("resolves with get/set/delete methods", async () => {
    const mock = createMockCookies();
    const cookies = await mock();
    expect(cookies).toHaveProperty("get");
    expect(cookies).toHaveProperty("set");
    expect(cookies).toHaveProperty("delete");
  });

  it("get returns value for known cookie", async () => {
    const mock = createMockCookies({ session: "abc123" });
    const cookies = await mock();
    const result = cookies.get("session");
    expect(result).toEqual({ name: "session", value: "abc123" });
  });

  it("get returns undefined for unknown cookie", async () => {
    const mock = createMockCookies({ session: "abc123" });
    const cookies = await mock();
    const result = cookies.get("nonexistent");
    expect(result).toBeUndefined();
  });

  it("get returns undefined from empty store", async () => {
    const mock = createMockCookies();
    const cookies = await mock();
    const result = cookies.get("anything");
    expect(result).toBeUndefined();
  });

  it("set and delete are callable", async () => {
    const mock = createMockCookies();
    const cookies = await mock();
    expect(() => cookies.set("key", "val")).not.toThrow();
    expect(() => cookies.delete("key")).not.toThrow();
  });

  it("handles multiple cookies", async () => {
    const mock = createMockCookies({
      session: "token",
      theme: "dark",
      lang: "en",
    });
    const cookies = await mock();
    expect(cookies.get("session")).toEqual({ name: "session", value: "token" });
    expect(cookies.get("theme")).toEqual({ name: "theme", value: "dark" });
    expect(cookies.get("lang")).toEqual({ name: "lang", value: "en" });
  });
});
