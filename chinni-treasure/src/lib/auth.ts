import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";
import { env } from "@/src/lib/env";

// Node-native TextEncoder — avoids jsdom polyfill breaking jose's Uint8Array checks
import { TextEncoder as NodeTextEncoder } from "util";
const encoder = new NodeTextEncoder();
const SECRET = encoder.encode(env.JWT_SECRET);
const COOKIE_NAME = "session";

const AdminSessionSchema = z.object({
  id: z.string(),
  username: z.string(),
  role: z.string(),
});

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signToken(payload: Record<string, unknown>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<Record<string, unknown> | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET, { algorithms: ["HS256"] });
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Record<string, unknown> | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

const isProd = process.env.NODE_ENV === "production";

export function createSessionCookie(token: string): string {
  const flags = ["HttpOnly", "Path=/", "SameSite=Lax", "Max-Age=86400"];
  if (isProd) flags.push("Secure");
  return `${COOKIE_NAME}=${token}; ${flags.join("; ")}`;
}

export function clearSessionCookie(): string {
  const flags = ["HttpOnly", "Path=/", "SameSite=Lax", "Max-Age=0"];
  if (isProd) flags.push("Secure");
  return `${COOKIE_NAME}=; ${flags.join("; ")}`;
}

export type AdminSession = z.infer<typeof AdminSessionSchema>;

export async function checkAuth(): Promise<AdminSession | null> {
  const session = await getSession();
  if (!session) return null;
  const parsed = AdminSessionSchema.safeParse(session);
  return parsed.success ? parsed.data : null;
}
