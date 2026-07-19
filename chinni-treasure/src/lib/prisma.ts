import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { env } from "@/src/lib/env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/** Maximum number of times to retry a query that fails with query_wait_timeout. */
const MAX_QUERY_RETRIES = 1;
/** Wait 250 ms before retrying (short enough for most transient backlogs). */
const RETRY_DELAY_MS = 250;

/**
 * Prisma / `@prisma/adapter-pg` throws DriverAdapterError with
 * cause.originalMessage === "query_wait_timeout" when the PostgreSQL
 * proxy (Nhost, PgBouncer, etc.) kills a query that waited too long
 * in the connection queue.  These are transient — retry once if we
 * see one.
 */
function isQueryWaitTimeout(err: unknown): boolean {
  if (err && typeof err === "object" && "cause" in err) {
    const cause = (err as { cause?: { originalMessage?: string } }).cause;
    return cause?.originalMessage === "query_wait_timeout";
  }
  return false;
}

/** Sleep helper so we can pause before retrying. */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Wrap every callable PrismaClient method with auto-retry so that
 * transient `query_wait_timeout` errors don't propagate to the UI.
 */
function wrapClient(client: PrismaClient): PrismaClient {
  return new Proxy(client, {
    get(target, prop: string | symbol) {
      const original = (target as unknown as Record<string | symbol, unknown>)[prop];

      // Only wrap async (thenable) methods — leave getters, symbols,
      // plain values untouched.
      if (
        typeof original === "function" &&
        original.constructor.name === "AsyncFunction"
      ) {
        return async (...args: unknown[]) => {
          let lastError: unknown;
          for (let attempt = 0; attempt <= MAX_QUERY_RETRIES; attempt++) {
            try {
              return await original.apply(target, args);
            } catch (err) {
              lastError = err;
              if (isQueryWaitTimeout(err) && attempt < MAX_QUERY_RETRIES) {
                console.warn(
                  `[prisma-retry] query_wait_timeout on attempt ${attempt + 1}, retrying…`,
                );
                await sleep(RETRY_DELAY_MS);
                continue;
              }
              throw err;
            }
          }
          throw lastError;
        };
      }

      return original;
    },
  });
}

function createPool() {
  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    // No idle connections — in serverless every connection counts.
    // With min:0, allowExitOnIdle can actually drain the pool and
    // let the runtime exit cleanly between invocations.
    min: 1,
    // Use all available Nhost free-tier connections (limit is ~5
    // across all services).  Running at 3 was causing pool exhaustion
    // and query_wait_timeout errors under moderate concurrency.
    max: 5,
    // Give more time for the initial TCP + TLS handshake to Nhost.
    connectionTimeoutMillis: 30_000,
    // Release idle connections promptly — serverless functions are
    // short-lived so there's no benefit to holding connections open.
    idleTimeoutMillis: 30_000,
    // Let the pool fully release when idle so the process can exit
    // cleanly in serverless environments.
    allowExitOnIdle: true,
  });

  pool.on("error", (err) => {
    console.error("[prisma-pool] Unexpected pool error:", err);
  });

  return pool;
}

export const prisma = new Proxy({} as unknown as PrismaClient, {
  get(_target, prop: string | symbol) {
    if (!globalForPrisma.prisma) {
      const pool = createPool();
      const adapter = new PrismaPg(pool);
      globalForPrisma.prisma = wrapClient(new PrismaClient({ adapter }));
    }
    return (globalForPrisma.prisma as PrismaClient)[prop as keyof PrismaClient];
  },
});
