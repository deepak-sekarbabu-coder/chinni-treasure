import { NextResponse } from "next/server";
import { loadLatestCategories } from "@/src/lib/catalogue-cache";
import { withPublic } from "@/src/lib/route-guard";

// GET /api/categories/latest
// Returns the newest in-stock, active product for every active category.
// The fetch itself is cached by catalogue-cache (60s TTL, purged on any
// catalogue mutation), so this handler is a thin envelope around it.
export const GET = withPublic(
  async () =>
    NextResponse.json(await loadLatestCategories(), {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    }),
  { fallbackError: "Failed to fetch latest category products" },
);
