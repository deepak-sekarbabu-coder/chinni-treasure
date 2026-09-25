/**
 * The one session-verify seam: the secret, the cookie name, and JWT
 * verification live here so proxy, route guards, and the auth routes share a
 * single resolution path. Verify-then-cookie means proxy.ts runs the same
 * verification in the Edge runtime without importing next/headers.
 */
import { jwtVerify } from "jose";
// Node-native TextEncoder — avoids jsdom polyfill breaking jose's Uint8Array checks
import { TextEncoder as NodeTextEncoder } from "util";
import { env } from "./env";

/** Admin session cookie name — the single definition. */
export const COOKIE_NAME = "session";

let _secret: Uint8Array | null = null;
function getSecret(): Uint8Array {
  if (!_secret) _secret = new NodeTextEncoder().encode(env.JWT_SECRET);
  return _secret;
}

export async function verifySession(token: string): Promise<Record<string, unknown> | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}
