import { NextResponse } from "next/server";
import { loadLatestCategories } from "@/src/lib/catalogue-cache";

// GET /api/categories/latest
// Returns the newest in-stock, active product for every active category.
// The fetch itself is cached by catalogue-cache (60s TTL, purged on any
// catalogue mutation), so this handler is a thin envelope around it.
export async function GET() {
  try {
    const payload = await loadLatestCategories();
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("Failed to fetch latest category products:", error);
    return NextResponse.json(
      { error: "Failed to fetch latest category products" },
      { status: 500 },
    );
  }
}
