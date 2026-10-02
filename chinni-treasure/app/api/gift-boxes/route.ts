import { NextResponse } from "next/server";
import { listGiftBoxes } from "@/src/lib/product-read";
import { CATALOGUE_CACHE_CONTROL } from "@/src/lib/catalogue-cache";
import { withPublic } from "@/src/lib/route-guard";

const RESPONSE_HEADERS = {
  headers: { "Cache-Control": CATALOGUE_CACHE_CONTROL.giftBoxes },
};

// GET /api/gift-boxes — List active gift-box products (public)
export const GET = withPublic(
  async () => NextResponse.json(await listGiftBoxes(), RESPONSE_HEADERS),
  { fallbackError: "Failed to fetch gift boxes" },
);
