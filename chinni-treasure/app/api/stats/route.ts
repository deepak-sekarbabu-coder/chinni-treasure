import { NextResponse } from "next/server";
import { getDashboardStats } from "@/src/lib/stats-cache";
import { withAdmin } from "@/src/lib/route-guard";

const RESPONSE_HEADERS = { headers: { "Cache-Control": "private, max-age=30" } };

// GET /api/stats — Dashboard statistics (admin only)
export const GET = withAdmin(
  async () => NextResponse.json(await getDashboardStats(), RESPONSE_HEADERS),
  { fallbackError: "Failed to fetch stats" },
);
