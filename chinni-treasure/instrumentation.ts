import { logger } from "@/lib/axiom/server";
import { createOnRequestError } from "@axiomhq/nextjs";

// Runs once when the server starts.
export async function register() {
  if (process.env.NODE_ENV === "production" && !process.env.REDIS_URL) {
    console.warn(
      "[redis] REDIS_URL is not set — every cache falls back to a per-instance in-memory store, which is NOT shared across Vercel serverless instances. Set REDIS_URL (e.g. Upstash) to enable shared caching.",
    );
  }
}

// Capture unhandled request errors (Next 15+ onRequestError hook) and send
// them to Axiom. No-op when Axiom is unconfigured.
export const onRequestError = createOnRequestError(logger);
