import { Prisma } from "@prisma/client";

/**
 * Product domain visibility. `visibleHostnames` is a comma-separated list of
 * hostnames a product is allowed on (empty/null = every domain). One predicate
 * — `isVisibleOnDomain` — owns "where is this product allowed"; the Postgres
 * filter and the product-detail gate both rest on it.
 *
 * Stored values are normalized on write to the padded form `, a.com, b.com, `
 * (lowercase, comma-space delimited) so the SQL filter can do exact/suffix
 * token matching with a plain `contains` — no substring leaks: a product
 * gated to example.com must never show on fake-example.com.
 */

export function normalizeHost(host: string | null): string | null {
  if (!host) return null;
  return host.split(":")[0].toLowerCase();
}

/** Split a visibleHostnames CSV into trimmed, lowercased tokens. */
function parseHosts(csv: string | null): string[] {
  return (csv ?? "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
}

/** Normalize an admin-entered CSV to the canonical padded storage form. */
export function normalizeVisibleHostnames(csv: string | null | undefined): string | null {
  const tokens = parseHosts(csv ?? null);
  return tokens.length ? `, ${tokens.join(", ")}, ` : null;
}

export function getHostFromRequest(request: Request): string | null {
  return normalizeHost(request.headers.get("host"));
}

/** Is this product allowed on the requesting hostname? */
export function isVisibleOnDomain(visibleHostnames: string | null, hostname: string | null): boolean {
  if (!visibleHostnames) return true; // empty/null = all domains
  const host = normalizeHost(hostname);
  if (!host) return true; // no Host header → no restriction (mirrors domainFilterWhere)
  return parseHosts(visibleHostnames).some((a) => host === a || host.endsWith(`.${a}`));
}

/** Postgres filter: empty/all domains, or an allowed hostname token matching the request. */
export function domainFilterWhere(hostname: string | null): Prisma.ProductWhereInput {
  const host = normalizeHost(hostname);
  if (!host) return {};

  // Request host `www.example.com` must match an allowed token `example.com`;
  // the padded `, token, ` form makes each match a whole token, never a fragment.
  const parts = host.split(".");
  const suffixes = parts.map((_, i) => parts.slice(i).join("."));
  return {
    OR: [
      { visibleHostnames: null },
      { visibleHostnames: "" },
      ...suffixes.map((h) => ({
        visibleHostnames: { contains: `, ${h}, `, mode: "insensitive" as const },
      })),
    ],
  };
}