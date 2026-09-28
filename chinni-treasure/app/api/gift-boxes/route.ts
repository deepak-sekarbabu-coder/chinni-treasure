import { NextResponse } from "next/server";
import { listGiftBoxes } from "@/src/lib/product-read";
import { withPublic } from "@/src/lib/route-guard";

const RESPONSE_HEADERS = {
  headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
};

// GET /api/gift-boxes — List active gift-box products (public)
export const GET = withPublic(
  async () => NextResponse.json(await listGiftBoxes(), RESPONSE_HEADERS),
  { fallbackError: "Failed to fetch gift boxes" },
);
