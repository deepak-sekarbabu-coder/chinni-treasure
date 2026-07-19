import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { env } from "@/src/lib/env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPool() {
  const url = new URL(env.DATABASE_URL);

  const pool = new Pool({
    connectionString: url.toString(),
    // Keep pool size within Nhost's free-tier connection pooler limits
    // (typically 5 concurrent connections).
    min: 2,
    max: 5,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
    // Rotate connections periodically to guard against memory/resource
    // leaks in long-running server processes.
    maxUses: 7_500,
  });

  // Surface pool-level errors without crashing the process.
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
