/**
 * Admin route adapter — the deep module that owns everything a mutating admin
 * route must do *before* and *after* its actual policy.
 *
 * Every admin mutation used to hand-print the same prologue and epilogue:
 *
 *   const csrfError = validateCsrfOrigin(request);
 *   if (csrfError) return csrfError;
 *   const admin = await checkAuth();
 *   if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 *   try {
 *     const body = await request.json();
 *     ... policy ...
 *     await invalidateCatalogCaches();
 *     revalidatePath("/catalogue"); revalidatePath("/"); revalidatePath("/category", "layout");
 *   } catch (error) {
 *     ... P2002 → 409, P2025 → 404, generic 500 ...
 *   }
 *
 * Ten copies of a security-critical prelude is ten chances to forget one.
 * Routes now declare their intent instead:
 *
 *   export const POST = withAdmin(async ({ body }) => {
 *     const parsed = validateOr400(Schema, body);
 *     if (!parsed.ok) return parsed.response;
 *     ...
 *     return NextResponse.json(product, { status: 201 });
 *   }, { revalidateCatalogue: true });
 *
 * The adapter reads only the handler's returned response — it never inspects
 * the policy — and its catch block maps the shared error taxonomy:
 * `statusCode`-bearing errors (OrderError, RazorpayGatewayError) map to their
 * own status, Prisma P2002/P2025 map to 409/404, everything else is a 500.
 */

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { checkAuth, type AdminSession } from "@/src/lib/auth";
import { validateCsrfOrigin } from "@/src/lib/csrf";

/** What the handler receives. `body`/`params` are present when the caller opts in. */
export interface AdminHandlerContext<P> {
  request: Request;
  /** The verified admin session — guaranteed non-null when the handler runs. */
  admin: AdminSession;
  /** Awaited route params (e.g. `{ id }`), when the route declares them. */
  params: P;
  /**
   * The parsed JSON body. Present only when `parseBody` is set (the route
   * declares whether it expects JSON; GET-ish or streaming handlers omit it).
   */
  body: unknown;
}

/** Route-specific copy for the shared Prisma error mapping. */
interface ErrorMessages {
  /** Override the 409 message for unique-constraint violations. */
  p2002?: string | ((target: string) => string);
  /** Override the 404 message for missing records. */
  p2025?: string;
}

interface WithAdminOptions {
  /**
   * Parse the request body as JSON before invoking the handler. Invalid JSON
   * is answered with a 400 and the handler never runs.
   */
  parseBody?: boolean;
  /**
   * After a successful (2xx) response, invalidate the catalogue caches and
   * revalidate the public catalogue surfaces — the epilogue every
   * catalogue-mutating route used to repeat.
   */
  revalidateCatalogue?: boolean;
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

/**
 * Shared error mapping for admin routes: `statusCode`-bearing errors keep
 * their status, Prisma P2002 → 409 and P2025 → 404, everything else → 500.
 */
export function mapAdminRouteError(
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
  }
  console.error("[admin-route] Unhandled route error:", error);
  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}

/** The catalogue-refresh epilogue shared by catalogue-mutating admin routes. */
export function revalidateCatalogueSurfaces(): void {
  revalidatePath("/catalogue");
  revalidatePath("/");
  revalidatePath("/category", "layout");
}

type AdminHandler<P> = (ctx: AdminHandlerContext<P>) => Promise<Response> | Response;

function resolveP2002Message(messages: ErrorMessages, error: Prisma.PrismaClientKnownRequestError): string {
  const target = (error.meta?.target as string[] | undefined)?.join(", ") || "field";
  const override = messages.p2002;
  if (typeof override === "function") return override(target);
  return override ?? `A record with this ${target} already exists`;
}

/**
 * Wrap an admin route handler with the shared guard: CSRF origin check →
 * session check (401) → optional body parse (400 on invalid JSON) → handler →
 * shared error mapping (+ optional catalogue revalidation on success).
 *
 * Security-critical because it is written once: a new admin route cannot
 * forget the origin check or the session check.
 */
export function withAdmin<P = Record<string, string>>(
  handler: AdminHandler<P>,
  options: WithAdminOptions & { fallbackError?: string; errorMessages?: ErrorMessages } = {},
): (request: Request, ctx?: { params: Promise<P> }) => Promise<Response> {
  const { parseBody = false, revalidateCatalogue = false, fallbackError = "Request failed", errorMessages = {} } = options;

  return async (request, ctx) => {
    const csrfError = validateCsrfOrigin(request);
    if (csrfError) return csrfError;

    const admin = await checkAuth();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const params = (await ctx?.params) ?? ({} as P);
      let body: unknown;
      if (parseBody) {
        try {
          body = await request.json();
        } catch {
          return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
        }
      }

      const response = await handler({ request, admin, params, body });

      if (revalidateCatalogue && response.ok) {
        revalidateCatalogueSurfaces();
      }
      return response;
    } catch (error) {
      return mapAdminRouteError(error, fallbackError, errorMessages);
    }
  };
}
