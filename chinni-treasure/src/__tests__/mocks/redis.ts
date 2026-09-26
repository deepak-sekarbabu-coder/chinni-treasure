type MockRedisSetCall = {
  key: string;
  value: string;
  mode?: string;
  ttl?: number;
};

/**
 * Minimal in-memory stand-in for the ioredis client used by the cache layer.
 * Supports the subset of commands the app actually uses: `get`, `set` (with an
 * optional `EX` TTL), `scan` (MATCH pattern), `del` and `ping`. Per-command
 * failures can be toggled on to exercise the in-memory fallback paths in
 * `src/lib/redis-cache.ts`, the cache-owning modules in
 * `src/lib/catalogue-cache.ts` / `src/lib/order-cache.ts`, and the
 * `/api/health/redis` health check.
 */
export function createMockRedis() {
  const store = new Map<string, string>();
  const setCalls: MockRedisSetCall[] = [];
  const fail: Record<"get" | "set" | "scan" | "del" | "ping", boolean> = {
    get: false,
    set: false,
    scan: false,
    del: false,
    ping: false,
  };
  let scanPages: number | null = null;
  let scanCall = 0;
  let pingHang = false;

  return {
    store,
    setCalls,

    setFail(method: keyof typeof fail, shouldFail: boolean): void {
      fail[method] = shouldFail;
    },

    /**
     * Simulate SCAN pagination: the next `n` scan calls return cursor "1"
     * (with an empty batch) and the final call returns cursor "0" with the
     * full matching set. Exercises the `do...while` drain loops.
     */
    setScanPages(n: number): void {
      scanPages = Math.max(1, n);
      scanCall = 0;
    },

    /**
     * Make `ping()` never resolve, so the health check's timeout guard fires.
     * Used together with Vitest fake timers to test the timeout branch.
     */
    setPingHang(hang: boolean): void {
      pingHang = hang;
    },

    reset(): void {
      store.clear();
      setCalls.length = 0;
      fail.get = false;
      fail.set = false;
      fail.scan = false;
      fail.del = false;
      fail.ping = false;
      scanPages = null;
      scanCall = 0;
      pingHang = false;
    },

    async get(key: string): Promise<string | null> {
      if (fail.get) throw new Error("redis get failed");
      return store.get(key) ?? null;
    },

    async set(key: string, value: string, mode?: string, ttl?: number): Promise<string> {
      if (fail.set) throw new Error("redis set failed");
      setCalls.push({ key, value, mode, ttl });
      store.set(key, value);
      return "OK";
    },

    // ioredis scan(cursor, "MATCH", pattern, "COUNT", count) -> [next, keys]
    async scan(...args: unknown[]): Promise<[string, string[]]> {
      if (fail.scan) throw new Error("redis scan failed");
      const pattern = String(args[2]);
      const prefix = pattern.replace("*", "");
      const keys = [...store.keys()].filter((k) => k.startsWith(prefix));
      if (scanPages === null) return ["0", keys];
      scanCall++;
      if (scanCall < scanPages) return ["1", []];
      return ["0", keys];
    },

    async del(...keys: string[]): Promise<number> {
      if (fail.del) throw new Error("redis del failed");
      let removed = 0;
      for (const key of keys) {
        if (store.delete(key)) removed++;
      }
      return removed;
    },

    async ping(): Promise<string> {
      if (fail.ping) throw new Error("redis ping failed");
      if (pingHang) return new Promise<string>(() => {});
      return "PONG";
    },
  };
}
