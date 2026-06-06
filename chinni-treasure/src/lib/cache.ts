export function createCache<T = unknown>(ttl: number) {
  const store = new Map<string, { data: T; expiry: number }>();

  return {
    get(key: string): T | null {
      const entry = store.get(key);
      if (entry && entry.expiry > Date.now()) return entry.data;
      store.delete(key);
      return null;
    },
    set(key: string, data: T): void {
      store.set(key, { data, expiry: Date.now() + ttl });
    },
    clear(): void {
      store.clear();
    },
  };
}
