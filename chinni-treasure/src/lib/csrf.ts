import { NextResponse } from "next/server";

/**
 * Validates that a state-changing request originates from the same origin.
 *
 * Browsers always send the `Origin` header on cross-origin state-changing
 * requests (POST, PUT, PATCH, DELETE). If the header is missing on a
 * same-origin request (common for same-site form submissions), we fall back
 * to checking the `Referer` header.
 *
 * Returns `null` if the request passes validation, or a 403 NextResponse
 * if the origin is invalid.
 */
export function validateCsrfOrigin(request: Request): NextResponse | null {
  const method = request.method;

  // Safe methods never need CSRF protection
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return null;
  }

  // Derive host from Host header, falling back to URL hostname
  const host = request.headers.get("Host") || new URL(request.url).host;
  if (!host) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const origin = request.headers.get("Origin");

  if (origin) {
    try {
      const originUrl = new URL(origin);
      // Allow same-origin and configured dev origins
      if (originUrl.host !== host && !isAllowedDevOrigin(originUrl.host)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return null;
    } catch {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // No Origin header — fall back to Referer (common for same-site form submissions)
  const referer = request.headers.get("Referer");
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (refererUrl.host !== host && !isAllowedDevOrigin(refererUrl.host)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return null;
    } catch {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // No Origin or Referer — reject state-changing requests without origin context
  // This blocks curl/Postman from outside the browser unless they set Origin
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/** Allow localhost dev origins when not in production */
function isAllowedDevOrigin(host: string): boolean {
  if (process.env.NODE_ENV !== "development") return false;
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.startsWith("localhost:") ||
    host.startsWith("127.0.0.1:")
  );
}
