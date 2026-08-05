import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { logger } from "@/lib/axiom/server";

// Cron invocations on Vercel are subject to function duration limits. The
// Hobby default is 10s while the pg pool connect timeout is 15s, so give a
// cold start + connect room to finish. 60s is the max on Hobby (300s on Pro).
export const maxDuration = 60;

// GET /api/cron/db-health — Keep-alive DB ping triggered by a Vercel Cron Job.
//
// Nhost's free tier pauses projects after 1 week of inactivity, so a
// scheduled `SELECT 1` keeps the database warm. Vercel sends
// `Authorization: Bearer <CRON_SECRET>` automatically when the CRON_SECRET
// env var is set; the `x-vercel-cron-schedule` header is present on every
// cron invocation. Without CRON_SECRET the endpoint reports "not_configured"
// and never touches the database, so it can't be abused as an open
// DB-connect endpoint.
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    logger.warn("Cron db-health not configured", { reason: "CRON_SECRET_missing" });
    return NextResponse.json({ status: "ok", db: "not_configured" });
  }

  const auth = request.headers.get("authorization");
  const provided = auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";
  const authorized =
    provided.length === cronSecret.length &&
    timingSafeEqual(Buffer.from(provided), Buffer.from(cronSecret));

  if (!authorized) {
    logger.warn("Cron db-health rejected", { reason: "unauthorized" });
    return NextResponse.json({ status: "unauthorized" }, { status: 401 });
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info("Cron db-health ok", { db: "connected" });
    return NextResponse.json({ status: "ok", db: "connected" });
  } catch (error) {
    logger.error("Cron db-health failed", {
      db: "unreachable",
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ status: "error", db: "unreachable" }, { status: 503 });
  }
}
