import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { env } from "@/src/lib/env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPool() {
  const url = new URL(env.DATABASE_URL);

  // pg-connection-string currently treats 'prefer', 'require', and
  // 'verify-ca' as aliases for 'verify-full' (and will warn about it in the
  // next major version). Normalize to the explicit mode so the deprecation
  // warning never fires — the behavior is identical, but the intent is clear.
  const sslmode = url.searchParams.get("sslmode");
  if (sslmode && ["prefer", "require", "verify-ca"].includes(sslmode)) {
    url.searchParams.set("sslmode", "verify-full");
  }

  const pool = new Pool({
    connectionString: url.toString(),
    // Nhost free tier has ~5 pooler slots; use max 3 to leave headroom
    // for other Vercel instances and avoid query_wait_timeout at the pooler.
    min: 0,
    max: 3,
    // Give enough time for Nhost + Vercel cold-start SSL handshake,
    // but not so long that queries pile up in the pooler queue.
    connectionTimeoutMillis: 15_000,
    // Release idle connections back to Nhost pooler aggressively.
    idleTimeoutMillis: 10_000,
    // Rotate connections frequently to avoid stale connections
    // accumulating in Nhost's pooler.
    maxUses: 100,
    // TCP keepalive to detect dead connections faster.
    keepAlive: true,
    keepAliveInitialDelayMillis: 30_000,
  });

  // Surface pool-level errors without crashing the process.
  pool.on("error", (err) => {
    console.error("[prisma-pool] Unexpected pool error:", err);
  });

  return pool;
}

// ---------------------------------------------------------------------------
// Automatic retry for transient database connection failures
// ---------------------------------------------------------------------------
// Nhost's pooler on free tier has limited backend slots (~5). When all slots
// are busy (e.g. multiple warm Vercel instances), new connection attempts
// queue up and can time out. These failures are transient — retrying after
// a brief backoff usually succeeds because a slot frees up.
//
// Two error modes are caught:
//   1. pg Pool "timeout exceeded when trying to connect" (plain Error)
//   2. Prisma P2010 with "query_wait_timeout" (Nhost pooler queue timeout)

function isRetryableConnectionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  // pg Pool fails to ESTABLISH a new connection within connectionTimeoutMillis.
  if (error.message.includes("timeout exceeded when trying to connect")) return true;

  // Nhost pooler queue timeout (Prisma surfaces it as a known request error).
  if (
    (error as { code?: string }).code === "P2010" &&
    error.message.includes("query_wait_timeout")
  ) {
    return true;
  }

  // An ESTABLISHED connection was dropped mid-query (e.g. the Nhost pooler or
  // a proxy terminated a stale/idle connection between checkout and execution).
  // These surface as "Connection terminated due to connection timeout" with a
  // cause of "Connection terminated unexpectedly". Retrying usually succeeds
  // because a fresh connection is checked out of the pool.
  if (
    error.message.includes("Connection terminated due to connection timeout") ||
    error.message.includes("Connection terminated unexpectedly")
  ) {
    return true;
  }

  return false;
}

/**
 * Recursively wraps a Prisma model proxy (e.g. `prisma.order`) so every
 * query method (findMany, count, create, …) is automatically retried up to
 * 3 times with exponential backoff (1s, 2s) when a retryable connection
 * error occurs.
 *
 * Depth is limited to 3 to avoid infinite recursion while covering the
 * model-proxy nesting pattern (e.g. `prisma.order.findMany`).
 */
function wrapModelProxy<T extends Record<string, unknown>>(target: T, depth = 0): T {
  return new Proxy(target, {
    get(obj, prop: string | symbol) {
      const value = Reflect.get(obj, prop);

      // Wrap query methods with retry logic
      if (typeof value === "function") {
        return async (...args: unknown[]) => {
          let lastError: unknown;
          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              return await Reflect.apply(value, obj, args);
            } catch (error) {
              lastError = error;
              if (isRetryableConnectionError(error) && attempt < 2) {
                // Exponential backoff: 1s, 2s — gives Nhost pooler time
                // to free up a backend connection slot before retrying.
                await new Promise((r) => setTimeout(r, 1_000 * Math.pow(2, attempt)));
                continue;
              }
              throw error;
            }
          }
          throw lastError;
        };
      }

      // Recursively wrap nested objects (e.g. prisma.order.items is another proxy)
      if (typeof value === "object" && value !== null && depth < 3) {
        return wrapModelProxy(value as Record<string, unknown>, depth + 1);
      }

      return value;
    },
  });
}

const RETRYABLE_TOP_LEVEL_FNS = new Set([
  "$transaction",
  "$queryRaw",
  "$executeRaw",
]);

export const prisma = new Proxy({} as unknown as PrismaClient, {
  get(_target, prop: string | symbol) {
    if (!globalForPrisma.prisma) {
      const pool = createPool();
      const adapter = new PrismaPg(pool);
      globalForPrisma.prisma = new PrismaClient({ adapter });
    }

    const value = (globalForPrisma.prisma as PrismaClient)[prop as keyof PrismaClient];

    // Wrap top-level database functions ($transaction, $queryRaw, $executeRaw)
    // so they also retry on connection timeouts.
    if (typeof prop === "string" && RETRYABLE_TOP_LEVEL_FNS.has(prop)) {
      const fn = value as (...args: unknown[]) => Promise<unknown>;
      return async (...args: unknown[]) => {
        let lastError: unknown;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            return await fn.apply(globalForPrisma.prisma, args);
          } catch (error) {
            lastError = error;
            if (isRetryableConnectionError(error) && attempt < 2) {
              await new Promise((r) => setTimeout(r, 1_000 * Math.pow(2, attempt)));
              continue;
            }
            throw error;
          }
        }
        throw lastError;
      };
    }

    // Wrap model proxies (prisma.order, prisma.category, …) so every
    // query method auto-retries on connection timeouts.
    if (typeof value === "object" && value !== null) {
      return wrapModelProxy(value as Record<string, unknown>);
    }

    return value;
  },
});
