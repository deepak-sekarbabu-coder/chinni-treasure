import { NextResponse } from "next/server";
import { logger } from "@/lib/axiom/server";
import { listGiftBoxes } from "@/src/lib/product-read";
import { giftBoxCache } from "@/src/lib/catalogue-cache";

const { get: getCached, set: setCache } = giftBoxCache;

// GET /api/gift-boxes — List active gift-box products (public)
export async function GET() {
  try {
    const cacheKey = "all";
    const cached = await getCached(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
      });
    }

    const payload = await listGiftBoxes();

    await setCache(cacheKey, payload);

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (error) {
    logger.error("Failed to fetch gift boxes", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to fetch gift boxes" }, { status: 500 });
  }
}
