"use client";

import {
  AxiomJSTransport,
  Logger,
  type Transport,
} from "@axiomhq/logging";
import { createWebVitalsComponent } from "@axiomhq/react";
import { nextJsFormatters } from "@axiomhq/nextjs/client";
import { axiomClient } from "./axiom";

const dataset = process.env.NEXT_PUBLIC_AXIOM_DATASET;

function buildTransports(): [Transport, ...Transport[]] {
  if (axiomClient && dataset) {
    return [new AxiomJSTransport({ axiom: axiomClient, dataset })];
  }
  // Unconfigured: silent no-op on the client (no console spam in dev).
  return [] as unknown as [Transport, ...Transport[]];
}

const logger = new Logger({
  transports: buildTransports(),
  formatters: nextJsFormatters,
});

const WebVitals = createWebVitalsComponent(logger);

export { WebVitals };
