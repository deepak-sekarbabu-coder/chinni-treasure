import { vi } from "vitest";

export function createMockCookies(store?: Record<string, string>) {
  const map = new Map(Object.entries(store ?? {}));

  return vi.fn().mockResolvedValue({
    get: vi.fn((name: string) => {
      const value = map.get(name);
      return value ? { name, value } : undefined;
    }),
    set: vi.fn(),
    delete: vi.fn(),
  });
}
