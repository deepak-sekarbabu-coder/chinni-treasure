import { describe, it, expect } from "vitest";
import { sanitize } from "../../lib/sanitize";

describe("sanitize", () => {
  it("strips HTML tags", () => {
    const result = sanitize("<script>alert('xss')</script>Hello");
    expect(result).not.toContain("<script>");
    expect(result).toContain("Hello");
  });

  it("trims whitespace", () => {
    const result = sanitize("  hello world  ");
    expect(result).toBe("hello world");
  });

  it("returns empty string for whitespace-only input", () => {
    const result = sanitize("   ");
    expect(result).toBe("");
  });

  it("passes through normal text unchanged", () => {
    const result = sanitize("Hello, this is a normal message!");
    expect(result).toBe("Hello, this is a normal message!");
  });
});
