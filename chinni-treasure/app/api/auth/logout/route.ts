import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/src/lib/auth";
import { validateCsrfOrigin } from "@/src/lib/csrf";

export async function POST(request: Request) {
  const csrfError = validateCsrfOrigin(request);
  if (csrfError) return csrfError;
  const response = NextResponse.json({ success: true });
  response.headers.set("Set-Cookie", clearSessionCookie());
  return response;
}
