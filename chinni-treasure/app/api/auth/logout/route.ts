import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/src/lib/auth";
import { withPublic } from "@/src/lib/route-guard";

// POST /api/auth/logout — the guard owns the origin check; clearing the cookie
// is the whole policy. No rate limit: the only effect is dropping a session.
export const POST = withPublic(async () => {
  const response = NextResponse.json({ success: true });
  response.headers.set("Set-Cookie", clearSessionCookie());
  return response;
});
