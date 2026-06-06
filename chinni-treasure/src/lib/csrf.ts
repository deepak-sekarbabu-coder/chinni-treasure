import { NextResponse } from "next/server";

const FORBIDDEN = NextResponse.json({ error: "Forbidden" }, { status: 403 });

function isHostAllowed(host: string, originOrReferer: string | null): boolean {
  if (!originOrReferer) return false;
  try {
    const url = new URL(originOrReferer);
    return url.host === host || isAllowedDevOrigin(url.host);
  } catch {
    return false;
  }
}

function isAllowedDevOrigin(host: string): boolean {
  if (process.env.NODE_ENV !== "development") return false;
  return host === "localhost" || host === "127.0.0.1" || host.startsWith("localhost:") || host.startsWith("127.0.0.1:");
}

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
