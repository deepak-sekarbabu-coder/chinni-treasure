import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { verifyPassword, signToken, createSessionCookie } from "@/src/lib/auth";
import { checkRateLimit, getClientIp } from "@/src/lib/rate-limiter";
import { validateCsrfOrigin } from "@/src/lib/csrf";
import { validateOr400 } from "@/src/lib/validate";
import { logger } from "@/lib/axiom/server";
import { z } from "zod";

const LoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: Request) {
  const csrfError = validateCsrfOrigin(request);
  if (csrfError) return csrfError;

  try {
    const { allowed } = await checkRateLimit(`login:${getClientIp(request)}`);

    if (!allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Try again later." },
        { status: 429, headers: { "Retry-After": "60" } },
      );
    }

    const body = await request.json();
    const parsed = validateOr400(LoginSchema, body);
    if (!parsed.ok) return parsed.response;
    const { username, password } = parsed.data;

    const admin = await prisma.admin.findUnique({ where: { username } });
    if (!admin || !admin.isActive) {
      logger.warn("Admin login rejected", { username, reason: "unknown_or_inactive" });
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await verifyPassword(password, admin.passwordHash);
    if (!valid) {
      logger.warn("Admin login rejected", { username, reason: "bad_password" });
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    const token = await signToken({ id: admin.id, username: admin.username, role: admin.role });
    const cookie = createSessionCookie(token);

    logger.info("Admin login succeeded", { adminId: admin.id, username: admin.username });

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
