import { vi } from 'vitest';

function createChromeMock() {
  return {
    commands: {
      onCommand: {
        addListener: vi.fn()
      },
      getAll: vi.fn(async () => [])
    },
    runtime: {
      onMessage: {
        addListener: vi.fn()
      },
      lastError: null
    },
    tabs: {
      query: vi.fn(async () => []),
      sendMessage: vi.fn(async () => ({})),
      create: vi.fn(async () => ({}))
    }
  };
}

globalThis.chrome = createChromeMock();
