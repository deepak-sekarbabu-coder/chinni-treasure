import { NextResponse } from "next/server";

const FORBIDDEN = NextResponse.json({ error: "Forbidden" }, { status: 403 });

/** Non-browser dev tools (curl, health checks) may omit Origin/Referer. */
function isAllowedDevOrigin(host: string): boolean {
  if (process.env.NODE_ENV !== "development") return false;
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.startsWith("localhost:") ||
    host.startsWith("127.0.0.1:")
  );
}

/** Same-host check, with a dev-only localhost escape hatch. */
function isHostAllowed(host: string, originOrReferer: string | null): boolean {
  if (!originOrReferer) return false;
  try {
    const url = new URL(originOrReferer);
    return url.host === host || isAllowedDevOrigin(url.host);
  } catch {
    return false;
  }
}

/**
 * CSRF origin policy for state-changing requests: every POST/PUT/PATCH/DELETE
 * must carry an Origin or Referer that matches the request host. GET/HEAD/
 * OPTIONS pass through; missing Origin+Referer is denied (browsers always
 * send one on cross-site POSTs, so only non-browser clients hit this).
 *
 * Returns `null` to allow, or a 403 response to short-circuit the route.
 */
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
