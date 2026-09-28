/**
 * Route guard module — the deep module that owns everything a route must do
 * *around* its policy, for both audiences it serves.
 *
 * Every route used to hand-print its own prologue and epilogue:
 *
 *   const csrfError = validateCsrfOrigin(request);
 *   if (csrfError) return csrfError;
 *   const { allowed } = await checkRateLimit(`order:${getClientIp(request)}`, 3);
 *   if (!allowed) return NextResponse.json({ error: "Too many …" }, { status: 429, … });
 *   try {
 *     const body = await request.json();
 *     ... policy ...
 *   } catch (error) {
 *     if (error instanceof OrderError) …
 *     if (error.code === "P2034") return NextResponse.json({ error: "Conflict …" }, { status: 409 });
 *     return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
 *   }
 *
 * Twelve copies of a security-critical prelude is twelve chances to forget one,
 * and the hand-rolled error taxonomy drifted: a serialization conflict answered
 * 409 on order placement and 500 on an admin fulfilment because only one copy
 * knew Prisma's P2034.
 *
 * Routes now declare their intent instead:
 *
 *   export const POST = withPublic(async ({ body }) => {
 *     const parsed = validateOr400(Schema, body);
 *     if (!parsed.ok) return parsed.response;
 *     ...
 *     return NextResponse.json(product, { status: 201 });
 *   }, { rateLimit: "order", parseBody: true, fallbackError: "Failed to create order" });
 *
 * Two guards share one core, because they differ only in the session policy:
 * `withAdmin` requires an admin session (and hands it to the handler),
 * `withPublic` requires none. `requireAdmin()` is exported for the two hybrid
 * GETs (`/api/products`, `/api/categories`) that branch public-vs-admin inside
 * a single handler — Next allows one exported `GET`, so they compose the pieces
 * instead of being wrapped, and stay a named exception.
 *
 * The adapter reads only the handler's returned response — it never inspects
 * the policy — and its catch block maps the shared error taxonomy.
 */

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { checkAuth, type AdminSession } from "@/src/lib/auth";
import { validateCsrfOrigin } from "@/src/lib/csrf";
import { guardRateLimit, type RateLimitPolicy } from "@/src/lib/rate-limiter";
import { invalidateCatalogCaches } from "@/src/lib/catalogue-cache";
import { logger } from "@/lib/axiom/server";

/** What every guarded handler receives: the request, params, and the parsed body. */
interface RouteContext<P> {
  request: Request;
  /** Awaited route params (e.g. `{ id }`); `{}` for routes without any. */
  params: P;
  /**
   * The parsed JSON body. Present only when `parseBody` is set (the route
   * declares whether it expects JSON; GET-ish handlers omit it).
   */
  body: unknown;
}

interface AdminHandlerContext<P> extends RouteContext<P> {
  /** The verified admin session — guaranteed non-null when the handler runs. */
  admin: AdminSession;
}

/** Route-specific copy for the shared Prisma error mapping. */
interface ErrorMessages {
  /** Override the 409 message for unique-constraint violations. */
  p2002?: string | ((target: string) => string);
  /** Override the 404 message for missing records. */
  p2025?: string;
  /** Override the 409 message for a serialization conflict. */
  p2034?: string;
}

interface GuardOptions {
  /** Parse the request body as JSON before invoking the handler. Invalid JSON is a 400. */
  parseBody?: boolean;
  /** Apply a named rate-limit policy before invoking the handler. */
  rateLimit?: RateLimitPolicy;
  /** Require an admin session (401) before invoking the handler. */
  requireAdmin?: boolean;
  /**
   * After a successful (2xx) response, invalidate the catalogue caches and
   * revalidate the public catalogue surfaces.
   */
  revalidateCatalogue?: boolean;
  fallbackError: string;
  errorMessages?: ErrorMessages;
}

/** Errors with a `statusCode` (OrderError, RazorpayGatewayError) map to their own status. */
interface StatusCodeError {
  statusCode: number;
  message: string;
}

function isStatusCodeError(error: unknown): error is StatusCodeError {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof (error as { statusCode?: unknown }).statusCode === "number" &&
    error instanceof Error
  );
}

function isKnownRequestError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}

function resolveP2002Message(
  messages: ErrorMessages,
  error: Prisma.PrismaClientKnownRequestError,
): string {
  const target = (error.meta?.target as string[] | undefined)?.join(", ") || "field";
  const override = messages.p2002;
  if (typeof override === "function") return override(target);
  return override ?? `A record with this ${target} already exists`;
}

/**
 * Shared error mapping for every guarded route: `statusCode`-bearing errors keep
 * their status, Prisma P2002 → 409, P2025 → 404, P2034 (serialization conflict,
 * which a versioned/serializable write can always hit) → 409, everything else → 500.
 */
export function mapRouteError(
  error: unknown,
  fallbackMessage: string,
  messages: ErrorMessages = {},
): NextResponse {
  if (isStatusCodeError(error)) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode });
  }
  if (isKnownRequestError(error)) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: messages.p2025 ?? "Record not found" }, { status: 404 });
    }
    if (error.code === "P2002") {
      return NextResponse.json({ error: resolveP2002Message(messages, error) }, { status: 409 });
    }
    if (error.code === "P2034") {
      return NextResponse.json(
        { error: messages.p2034 ?? "Conflict detected. Please retry." },
        { status: 409 },
      );
    }
  }
  logger.error("Route unhandled error", {
    error: error instanceof Error ? error.message : String(error),
  });
  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}

/**
 * The session refusal, in one place: the verified session, or the 401 to return.
 * Exported for the hybrid GETs, which branch public-vs-admin inside one handler.
 */
export async function requireAdmin(): Promise<AdminSession | NextResponse> {
  const admin = await checkAuth();
  return admin ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/**
 * The catalogue-refresh epilogue every catalogue-mutating route used to repeat:
 * clear the six owned namespaces (Redis + in-memory fallback) and revalidate the
 * three public surfaces. One declaration, one home.
 */
export async function refreshCatalogue(): Promise<void> {
  await invalidateCatalogCaches();
  revalidatePath("/catalogue");
  revalidatePath("/");
  revalidatePath("/category", "layout");
}

/**
 * The shared core: CSRF origin check → optional session (401) → optional named
 * rate limit (429) → optional body parse (400) → handler → optional catalogue
 * revalidation on success → shared error mapping.
 *
 * Security-critical because it is written once: a new route of either audience
 * cannot forget the origin check.
 */
async function runGuarded<P>(
  handler: (ctx: RouteContext<P> & { admin: AdminSession | null }) => Promise<Response> | Response,
  request: Request,
  ctx: { params: Promise<P> } | undefined,
  options: GuardOptions,
): Promise<Response> {
  const csrfError = validateCsrfOrigin(request);
  if (csrfError) return csrfError;

  let admin: AdminSession | null = null;
  if (options.requireAdmin) {
    const session = await requireAdmin();
    if (session instanceof NextResponse) return session;
    admin = session;
  }

  if (options.rateLimit) {
    const limited = await guardRateLimit(options.rateLimit, request);
    if (limited) return limited;
  }

  try {
    const params = (await ctx?.params) ?? ({} as P);
    let body: unknown;
    if (options.parseBody) {
      try {
        body = await request.json();
      } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
      }
    }

    const response = await handler({ request, params, body, admin });

    if (options.revalidateCatalogue && response.ok) {
      await refreshCatalogue();
    }
    return response;
  } catch (error) {
    return mapRouteError(error, options.fallbackError, options.errorMessages);
  }
}

type AdminHandler<P> = (ctx: AdminHandlerContext<P>) => Promise<Response> | Response;
type PublicHandler<P> = (ctx: RouteContext<P>) => Promise<Response> | Response;

interface WithAdminOptions {
  parseBody?: boolean;
  revalidateCatalogue?: boolean;
  fallbackError?: string;
  errorMessages?: ErrorMessages;
}

interface WithPublicOptions {
  rateLimit?: RateLimitPolicy;
  parseBody?: boolean;
  fallbackError?: string;
  errorMessages?: ErrorMessages;
}

/** Wrap an admin route: the shared core plus the session check. */
export function withAdmin<P = Record<string, string>>(
  handler: AdminHandler<P>,
  options: WithAdminOptions = {},
): (request: Request, ctx?: { params: Promise<P> }) => Promise<Response> {
  const {
    parseBody = false,
    revalidateCatalogue = false,
    fallbackError = "Request failed",
    errorMessages,
  } = options;

  return (request, ctx) =>
    runGuarded(
      // The guard answers 401 before the handler runs, so `admin` is non-null here.
      (routeCtx) => handler({ ...routeCtx, admin: routeCtx.admin as AdminSession }),
      request,
      ctx,
      { parseBody, revalidateCatalogue, requireAdmin: true, fallbackError, errorMessages },
    );
}

/** Wrap a public route: the shared core, no session. */
export function withPublic<P = Record<string, string>>(
  handler: PublicHandler<P>,
  options: WithPublicOptions = {},
): (request: Request, ctx?: { params: Promise<P> }) => Promise<Response> {
  const { rateLimit, parseBody = false, fallbackError = "Request failed", errorMessages } = options;

  return (request, ctx) =>
    runGuarded(handler, request, ctx, { rateLimit, parseBody, fallbackError, errorMessages });
}
