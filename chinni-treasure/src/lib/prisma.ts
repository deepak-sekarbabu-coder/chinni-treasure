import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { env } from "@/src/lib/env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPool() {
  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    // No idle connections — in serverless every connection counts.
    // With min:0, allowExitOnIdle can actually drain the pool and
    // let the runtime exit cleanly between invocations.
    min: 0,
    // Cap at 3 concurrent connections per serverless invocation.
    // Nhost free-tier allows ~5 total; leaving headroom for other
    // services (Hasura, auth, storage) avoids pool exhaustion.
    max: 3,
    // Fail fast if the server can't hand us a connection within 10 s.
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
      globalForPrisma.prisma = new PrismaClient({ adapter });
    }
    return (globalForPrisma.prisma as PrismaClient)[prop as keyof PrismaClient];
  },
});
