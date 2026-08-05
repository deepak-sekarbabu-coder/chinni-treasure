import { Axiom } from "@axiomhq/js";

// The Axiom client is only created when a token is configured. Without one
// (local dev, preview deployments) every logger falls back to a no-op /
// console transport and the app behaves exactly as before.
//
// NEXT_PUBLIC_* is used because the same client is shared by the server and
// the browser (Web Vitals + client logs). Axiom recommends issuing a
// client-side token with ingest-only permission for a single dataset.
const token = process.env.NEXT_PUBLIC_AXIOM_TOKEN;
// Ingest must go to the account's edge deployment domain (visible in the Axiom
// UI under Settings -> Data, or via GET /v1/datasets -> edgeDeploymentUrl).
// Without it Axiom rejects ingest with "must use the ... edge deployment domain".
const edge = process.env.NEXT_PUBLIC_AXIOM_EDGE;

export const axiomClient: Axiom | null = token
  ? new Axiom({
      token,
      ...(edge ? { edge } : {}),
      // Log-delivery failures (bad token, missing dataset, network) must never
      // take the app down — surface them as warnings instead of unhandled
      // promise rejections from the SDK's background batch flushes.
      onError: (error: Error) => {
        console.warn("[axiom] log delivery failed:", error.message);
      },
    })
  : null;

export default axiomClient;
