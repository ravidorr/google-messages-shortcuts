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
    },
    storage: {
      local: {
        get: vi.fn(async () => ({})),
        set: vi.fn(async () => {})
      },
      onChanged: {
        addListener: vi.fn(),
        removeListener: vi.fn()
      }
    }
  };
}

globalThis.chrome = createChromeMock();
