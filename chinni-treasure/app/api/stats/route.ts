import { NextResponse } from "next/server";
import { statsCache } from "@/src/lib/stats-cache";
import { computeDashboardStats } from "@/src/lib/stats";
import { withAdmin } from "@/src/lib/admin-route";

const { get: getCached, set: setCache } = statsCache;
const RESPONSE_HEADERS = { headers: { "Cache-Control": "private, max-age=30" } };

// GET /api/stats — Dashboard statistics (admin only)
export const GET = withAdmin(async () => {
  try {
    const cached = await getCached("stats");
    if (cached) {
      return NextResponse.json(cached, RESPONSE_HEADERS);
    }

    const payload = await computeDashboardStats();
    await setCache("stats", payload);

    return NextResponse.json(payload, RESPONSE_HEADERS);
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
});