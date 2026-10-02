import { NextResponse } from "next/server";
import { CATALOGUE_CACHE_CONTROL, loadLatestCategories } from "@/src/lib/catalogue-cache";
import { withPublic } from "@/src/lib/route-guard";

// GET /api/categories/latest
// Returns the newest in-stock, active product for every active category.
// The fetch itself is cached by catalogue-cache (60s TTL, purged on any
// catalogue mutation), so this handler is a thin envelope around it. The edge
// header comes from that TTL, not from a number typed here.
export const GET = withPublic(
  async () =>
    NextResponse.json(await loadLatestCategories(), {
      headers: { "Cache-Control": CATALOGUE_CACHE_CONTROL.latest },
    }),
  { fallbackError: "Failed to fetch latest category products" },
);
