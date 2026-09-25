import '@testing-library/jest-dom';
import { vi } from 'vitest';

// @axiomhq/nextjs expects Next.js's runtime global AsyncLocalStorage
// (polyfilled by Next). Provide it for plain-Node test runs.
import { AsyncLocalStorage } from 'node:async_hooks';
if (!(globalThis as Record<string, unknown>).AsyncLocalStorage) {
  (globalThis as Record<string, unknown>).AsyncLocalStorage = AsyncLocalStorage;
}

// Keep Axiom logging inert under test — routes import the logger, but tests
// assert on responses, not log output.
vi.mock('@/lib/axiom/server', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    log: vi.fn(),
    flush: vi.fn(),
  },
}));

// Seed env vars instead of mocking @/src/lib/env: the real module then runs
// in every test, so env resolution itself stays under test.
process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET ??= 'test-secret';
process.env.NEXT_PUBLIC_SITE_URL ??= 'http://localhost:3000';
process.env.ALLOWED_ORIGIN ??= 'http://localhost:3000';

// Force the in-memory fallback for Redis-backed caches and rate limiting.
// Without this, tests would hit a live REDIS_URL when one is configured
// in the dev environment, making behavior non-deterministic.
vi.mock('@/src/lib/redis', () => ({ redis: null }));

// Restore Node-native globals that jsdom polyfills break (jose needs real Uint8Array)
import { TextEncoder, TextDecoder } from 'util';
Object.assign(globalThis, { TextEncoder, TextDecoder });

// Global mocks for Next.js modules
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next/image', () => ({
  default: () => null,
}));

vi.mock('next/headers', () => ({
  cookies: () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  }),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  // Pass-through so module-owned cached reads stay unit-testable.
  unstable_cache: (fn: unknown) => fn,
}));


// Clean up mocks between tests
afterEach(() => {
  vi.clearAllMocks();
});

// Browser-only mocks — skip when running in node environment (e.g. auth tests)
if (typeof window !== "undefined") {
  // Mock window.matchMedia
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin: string = "";
    readonly thresholds: ReadonlyArray<number> = [];
    constructor() {}
    disconnect() {}
    observe() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
    unobserve() {}
  } as unknown as { new(): IntersectionObserver };
}
