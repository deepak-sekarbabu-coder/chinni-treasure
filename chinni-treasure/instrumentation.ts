import { logger } from "@/lib/axiom/server";
import { createOnRequestError } from "@axiomhq/nextjs";

// Capture unhandled request errors (Next 15+ onRequestError hook) and send
// them to Axiom. No-op when Axiom is unconfigured.
export const onRequestError = createOnRequestError(logger);
