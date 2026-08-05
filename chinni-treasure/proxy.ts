import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { logger } from "./lib/axiom/server";
import { transformMiddlewareRequest } from "@axiomhq/nextjs";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret",
);

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl;

  // Send structured request logs to Axiom (no-op when Axiom is unconfigured).
  // Logged before the auth checks so failed/redirected admin requests are
  // captured too.
  logger.info(...transformMiddlewareRequest(request));

  if (pathname === "/admin/login") {
    event.waitUntil(logger.flush().catch(() => {}));
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get("session")?.value;

    if (!token) {
      event.waitUntil(logger.flush().catch(() => {}));
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    try {
      await jwtVerify(token, JWT_SECRET);
    } catch {
      event.waitUntil(logger.flush().catch(() => {}));
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  event.waitUntil(logger.flush().catch(() => {}));
  return NextResponse.next();
}

export const config = {
  // Admin routes (auth protection) plus all page traffic for Axiom request
  // logging. API routes, Next.js internals, metadata files and public static
  // assets (images/icons/fonts) are excluded to keep log volume low.
  matcher: [
    "/((?!api|_next/static|_next/image|images|icons|fonts|manifest.json|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
