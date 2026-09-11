import { NextResponse } from "next/server";

export type PageQuery = {
  page: number;
  limit: number;
  skip: number;
  sort: string | undefined;
};

export type PageEnvelope<TItems extends Record<string, unknown>> = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} & TItems;

export type ListQueryOptions<TMap extends object = Record<string, never>> = Readonly<{
  defaultLimit: number;
  maxLimit: number;
  defaultSort?: string;
  /** When provided, its keys are the only accepted sort values; anything else is a 400. */
  sortMap?: TMap;
}>;

/**
 * The one pagination parser every list route uses. Owns page/limit clamping,
 * skip arithmetic, and sort-key validation so the fifth copy never re-appears.
 */
export function parseListQuery<TMap extends object = Record<string, never>>(
  searchParams: URLSearchParams,
  opts: ListQueryOptions<TMap>,
): PageQuery | NextResponse {
  const rawPage = parseInt(searchParams.get("page") ?? "", 10);
  const rawLimit = parseInt(searchParams.get("limit") ?? "", 10);

  const page = Number.isFinite(rawPage) ? Math.max(1, rawPage) : 1;
  const limit = Number.isFinite(rawLimit)
    ? Math.min(opts.maxLimit, Math.max(1, rawLimit))
    : opts.defaultLimit;

  let sort: string | undefined;
  if (opts.sortMap) {
    sort = searchParams.get("sort") || opts.defaultSort;
    if (sort !== undefined && !(sort in opts.sortMap)) {
      return NextResponse.json({ error: `Invalid sort: ${sort}` }, { status: 400 });
    }
  }

  return { page, limit, skip: (page - 1) * limit, sort };
}

export function totalPages(total: number, limit: number): number {
  return Math.max(1, Math.ceil(total / limit));
}