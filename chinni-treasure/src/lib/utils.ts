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