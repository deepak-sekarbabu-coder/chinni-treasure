import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { env } from "@/src/lib/env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/** Maximum number of times to retry a query that fails with query_wait_timeout. */
const MAX_QUERY_RETRIES = 2;
/** Wait before retrying — start short, doubles each attempt. */
const RETRY_DELAY_MS = 300;

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

      // Wrap every callable method so retry logic covers Prisma delegate
      // methods (findUnique, findMany, etc.) which are plain functions
      // returning thenables, not AsyncFunction instances.
      if (typeof original === "function") {
        return (...args: unknown[]) => {
          const invoke = (attempt: number): unknown => {
            try {
              const result = original.apply(target, args);
              // If the call returns a thenable, attach catch-based retry
              // so we intercept query_wait_timeout without altering the
              // return type.
              if (result && typeof (result as { then?: unknown }).then === "function") {
                return (result as Promise<unknown>).catch((err: unknown) => {
                  if (isQueryWaitTimeout(err) && attempt < MAX_QUERY_RETRIES) {
                    console.warn(
                      `[prisma-retry] query_wait_timeout on attempt ${attempt + 1}/${MAX_QUERY_RETRIES + 1}, retrying in ${RETRY_DELAY_MS * (attempt + 1)} ms…`,
                    );
                    return sleep(RETRY_DELAY_MS * (attempt + 1)).then(() => invoke(attempt + 1));
                  }
                  throw err;
                });
              }
              return result;
            } catch (err) {
              throw err;
            }
          };
          return invoke(0);
        };
      }

      return original;
    },
  });
}

function createPool() {
  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    // In serverless we want the pool to fully drain so the process can
    // exit cleanly between invocations.  min:0 + allowExitOnIdle lets
    // the runtime release all connections when idle.
    min: 1,
    // Use all available Nhost free-tier connections (limit is ~5
    // across all services).  Running at 3 was causing pool exhaustion
    // and query_wait_timeout errors under moderate concurrency.
    max: 3,
    // Give enough time for the initial TCP + TLS handshake but fail
    // fast if the database is genuinely unreachable.
    connectionTimeoutMillis: 10_000,
    // Release idle connections promptly — serverless functions are
    // short-lived so there's no benefit to holding connections open.
    idleTimeoutMillis: 10_000,
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
