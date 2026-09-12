import { NextResponse } from "next/server";
import { checkAuth } from "@/src/lib/auth";

export async function GET() {
  const session = await checkAuth();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, ...session });
}
