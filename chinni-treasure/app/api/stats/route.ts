import { NextResponse } from "next/server";
import { logger } from "@/lib/axiom/server";
import { getDashboardStats } from "@/src/lib/stats-cache";
import { withAdmin } from "@/src/lib/admin-route";

const RESPONSE_HEADERS = { headers: { "Cache-Control": "private, max-age=30" } };

// GET /api/stats — Dashboard statistics (admin only)
export const GET = withAdmin(async () => {
  try {
    return NextResponse.json(await getDashboardStats(), RESPONSE_HEADERS);
  } catch (error) {
    logger.error("Failed to fetch stats", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
});