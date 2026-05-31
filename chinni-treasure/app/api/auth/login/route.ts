import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { verifyPassword, signToken, createSessionCookie } from "@/src/lib/auth";
import { checkRateLimit } from "@/src/lib/rate-limiter";

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const { allowed } = checkRateLimit(`login:${ip}`);

    if (!allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Try again later." },
        { status: 429, headers: { "Retry-After": "60" } },
      );
    }

    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    const admin = await prisma.admin.findUnique({ where: { username } });
    if (!admin || !admin.isActive) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await verifyPassword(password, admin.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    const token = signToken({ id: admin.id, username: admin.username, role: admin.role });
    const cookie = createSessionCookie(token);

    const response = NextResponse.json({
      id: admin.id,
      username: admin.username,
      role: admin.role,
    });
    response.headers.set("Set-Cookie", cookie);
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
