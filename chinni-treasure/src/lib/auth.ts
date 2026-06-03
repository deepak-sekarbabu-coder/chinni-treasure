import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function base64url(source: ArrayBuffer | Uint8Array): string {
  const bytes = source instanceof Uint8Array ? source : new Uint8Array(source);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64urlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (str.length % 4)) % 4;
  if (padding) str += "=".repeat(padding);
  return Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

const RAW_SECRET = (process.env.JWT_SECRET || "dev-secret");
const COOKIE_NAME = "session";

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signToken(payload: Record<string, unknown>): Promise<string> {
  const header = JSON.stringify({ alg: "HS256", typ: "JWT" });
  const body = JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 86400 });
  const headerB64 = base64url(encoder.encode(header));
  const bodyB64 = base64url(encoder.encode(body));
  const data = encoder.encode(`${headerB64}.${bodyB64}`).buffer as ArrayBuffer;
  const key = await importKey(RAW_SECRET);
  const signature = await crypto.subtle.sign("HMAC", key, data);
  return `${headerB64}.${bodyB64}.${base64url(signature)}`;
}

export async function verifyToken(token: string): Promise<Record<string, unknown> | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [headerB64, bodyB64, sigB64] = parts;

    // Verify signature
    const data = encoder.encode(`${headerB64}.${bodyB64}`).buffer as ArrayBuffer;
    const key = await importKey(RAW_SECRET);
    const signature = base64urlDecode(sigB64).buffer as ArrayBuffer;
    const valid = await crypto.subtle.verify("HMAC", key, signature, data);
    if (!valid) return null;

    // Parse header
    const headerRaw = base64urlDecode(headerB64);
    const header = JSON.parse(decoder.decode(headerRaw));
    if (header.alg !== "HS256") return null;

    // Parse body
    const bodyRaw = base64urlDecode(bodyB64);
    const body = JSON.parse(decoder.decode(bodyRaw));

    // Check expiration
    if (body.exp && body.exp < Math.floor(Date.now() / 1000)) return null;

    return body as Record<string, unknown>;
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
