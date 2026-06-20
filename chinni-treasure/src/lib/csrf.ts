import { NextResponse } from "next/server";
import { isHostAllowed } from "./csrf-helpers";

const FORBIDDEN = NextResponse.json({ error: "Forbidden" }, { status: 403 });

export function validateCsrfOrigin(request: Request): NextResponse | null {
  const method = request.method;
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return null;

  const host = request.headers.get("Host") || new URL(request.url).host;
  if (!host) return FORBIDDEN;

  const origin = request.headers.get("Origin");
  if (origin) return isHostAllowed(host, origin) ? null : FORBIDDEN;

  const referer = request.headers.get("Referer");
  if (referer) return isHostAllowed(host, referer) ? null : FORBIDDEN;

  return FORBIDDEN;
}
