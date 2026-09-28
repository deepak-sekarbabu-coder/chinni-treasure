import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { verifyPassword, signToken, createSessionCookie } from "@/src/lib/auth";
import { withPublic } from "@/src/lib/route-guard";
import { validateOr400 } from "@/src/lib/validate";
import { logger } from "@/lib/axiom/server";
import { z } from "zod";

const LoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// POST /api/auth/login — the guard bounds attempts per IP (the "login" policy)
// and owns the origin check; the route holds only the credential policy.
export const POST = withPublic(
  async ({ body }) => {
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
  },
  { rateLimit: "login", parseBody: true, fallbackError: "Internal server error" },
);
