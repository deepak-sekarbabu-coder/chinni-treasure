import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

// GET /api/health/db — Lightweight DB connectivity check.
// Used by external keep-alive services (cron, UptimeRobot, etc.)
// to prevent Vercel serverless cold starts.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", db: "connected" });
  } catch {
    return NextResponse.json({ status: "error", db: "unreachable" }, { status: 503 });
  }
}
