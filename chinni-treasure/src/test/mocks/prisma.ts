import { vi } from "vitest";

export function createMockPrisma() {
  return {
    admin: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    product: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    order: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      aggregate: vi.fn(),
    },
    orderItem: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  };
}

export const mockTx = {
  product: {
    findMany: vi.fn(),
    update: vi.fn(),
  },
  order: {
    create: vi.fn(),
    update: vi.fn(),
  },
};
