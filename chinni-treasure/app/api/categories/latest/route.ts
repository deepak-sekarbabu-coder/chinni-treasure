import { NextResponse } from "next/server";
import { CATALOGUE_CACHE_CONTROL } from "@/src/lib/catalogue-cache";
import { listLatestPerCategory } from "@/src/lib/product-read";
import { withPublic } from "@/src/lib/route-guard";

// GET /api/categories/latest
// Returns the newest in-stock, active product for every active category.
// The read lives in the Catalogue read module and is cached through the
// module-owned catLatestCache (60s TTL, purged on any catalogue mutation), so
// this handler is a thin envelope around it. The edge header comes from that
// TTL, not from a number typed here.
export const GET = withPublic(
  async () =>
    NextResponse.json(await listLatestPerCategory(), {
      headers: { "Cache-Control": CATALOGUE_CACHE_CONTROL.latest },
    }),
  { fallbackError: "Failed to fetch latest category products" },
);