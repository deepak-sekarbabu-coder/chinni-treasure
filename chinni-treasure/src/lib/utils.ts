import { randomUUID } from "crypto";

export function generateOrderNumber(): string {
  return `ORD-${randomUUID().split("-")[0].toUpperCase()}`;
}

export function extractApiErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string") {
    return (err as { message: string }).message;
  }
  return fallback;
}

/**
 * Convert an arbitrary string into a URL-safe kebab-case slug.
 * Lowercases, replaces non-alphanumeric runs with hyphens, and trims edges.
 */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}