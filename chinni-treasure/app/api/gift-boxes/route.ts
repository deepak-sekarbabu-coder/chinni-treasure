import { NextResponse } from "next/server";
import { logger } from "@/lib/axiom/server";
import { listGiftBoxes } from "@/src/lib/product-read";

const RESPONSE_HEADERS = {
  headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
};

// GET /api/gift-boxes — List active gift-box products (public)
export async function GET() {
  try {
    return NextResponse.json(await listGiftBoxes(), RESPONSE_HEADERS);
  } catch (error) {
    logger.error("Failed to fetch gift boxes", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to fetch gift boxes" }, { status: 500 });
  }
}
