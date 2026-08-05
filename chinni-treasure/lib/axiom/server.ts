import {
  AxiomJSTransport,
  ConsoleTransport,
  Logger,
  type Transport,
} from "@axiomhq/logging";
import { nextJsFormatters } from "@axiomhq/nextjs";
import { axiomClient } from "./axiom";

const dataset = process.env.NEXT_PUBLIC_AXIOM_DATASET;

function buildTransports(): [Transport, ...Transport[]] {
  if (axiomClient && dataset) {
    return [new AxiomJSTransport({ axiom: axiomClient, dataset })];
  }
  // No Axiom configured — keep terminal visibility in dev, stay silent in
  // the test runner (vitest sets NODE_ENV=test).
  if (process.env.NODE_ENV === "test") {
    return [] as unknown as [Transport, ...Transport[]];
  }
  return [new ConsoleTransport()];
}

export const logger = new Logger({
  transports: buildTransports(),
  formatters: nextJsFormatters,
});
