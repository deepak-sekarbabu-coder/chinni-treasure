import { describe, it, expect } from "vitest";
import { z } from "zod";
import { validateOr400 } from "@/src/lib/validate";

const SampleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  quantity: z.coerce.number().int().positive("Quantity must be positive"),
});

describe("validateOr400", () => {
  it("returns the parsed data on valid input", () => {
    const result = validateOr400(SampleSchema, { name: "Widget", quantity: "3" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      // z.coerce applies — quantity arrives as a number.
      expect(result.data).toEqual({ name: "Widget", quantity: 3 });
    }
  });

  it("returns a 400 response joining every issue message on invalid input", async () => {
    const result = validateOr400(SampleSchema, { name: "", quantity: -1 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(400);
      await expect(result.response.json()).resolves.toEqual({
        error: "Name is required, Quantity must be positive",
      });
    }
  });

  it("does not mutate or reuse state between calls", () => {
    const ok = validateOr400(SampleSchema, { name: "A", quantity: 1 });
    const bad = validateOr400(SampleSchema, { name: "", quantity: 0 });
    expect(ok.ok).toBe(true);
    expect(bad.ok).toBe(false);
  });
});
