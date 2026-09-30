import { describe, expect, it, vi } from 'vitest';
import {
  isConversationOpeningEnabled,
  setConversationOpeningEnabled
} from '../../src/shared/conversation-open-preference.js';

describe('conversation-open-preference', () => {
  it('defaults to disabled when no value is stored', async () => {
    const chromeApi = {
      storage: {
        local: {
          get: vi.fn(async () => ({}))
        }
      }
    };

    await expect(isConversationOpeningEnabled(chromeApi)).resolves.toBe(false);
  });

  it('uses the saved enabled value', async () => {
    const chromeApi = {
      storage: {
        local: {
          get: vi.fn(async () => ({ openConversationOnFocus: true }))
        }
      }
    };

    await expect(isConversationOpeningEnabled(chromeApi)).resolves.toBe(true);
  });

  it('uses the saved disabled value', async () => {
    const chromeApi = {
      storage: {
        local: {
          get: vi.fn(async () => ({ openConversationOnFocus: false }))
        }
      }
    };

    await expect(isConversationOpeningEnabled(chromeApi)).resolves.toBe(false);
  });

  it('defaults to disabled when storage cannot be read', async () => {
    const chromeApi = {
      storage: {
        local: {
          get: vi.fn(async () => {
            throw new Error('storage unavailable');
          })
        }
      }
    };

    await expect(isConversationOpeningEnabled(chromeApi)).resolves.toBe(false);
  });

  it('persists the selected enabled state', async () => {
    const set = vi.fn(async () => {});
    const chromeApi = {
      storage: {
        local: { set }
      }
    };

    await setConversationOpeningEnabled(true, chromeApi);

    expect(set).toHaveBeenCalledWith({ openConversationOnFocus: true });
  });
});
