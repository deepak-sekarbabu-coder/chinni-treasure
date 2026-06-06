import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

// Use Node-native TextEncoder to avoid jsdom polyfill breaking jose's Uint8Array checks
import { TextEncoder as NodeTextEncoder } from "util";
const encoder = new NodeTextEncoder();
const SECRET = encoder.encode(process.env.JWT_SECRET || "dev-secret");
const COOKIE_NAME = "session";

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

export function createSessionCookie(token: string): string {
  return `${COOKIE_NAME}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=86400`;
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`;
}

interface AdminSession {
  id: string;
  username: string;
  role: string;
}

export async function checkAuth(): Promise<AdminSession | null> {
  const session = await getSession();
  if (!session) return null;
  return session as unknown as AdminSession;
}
