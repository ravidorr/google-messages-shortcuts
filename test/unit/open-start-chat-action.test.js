import { describe, expect, it, vi } from 'vitest';
import { handleOpenStartChat } from '../../src/content/open-start-chat-action.js';
import * as startChatAdapter from '../../src/content/adapters/start-chat-adapter.js';

describe('open-start-chat-action', () => {
  it('opens start chat when the extension is active', async () => {
    vi.spyOn(startChatAdapter, 'openStartChat')
      .mockResolvedValueOnce({ ok: true });

    const localThis = await handleOpenStartChat(document, {
      storage: {
        local: {
          get: vi.fn(async () => ({}))
        }
      }
    });

    expect(localThis).toEqual({ ok: true });
  });

  it('returns extension-paused when shortcuts are paused', async () => {
    const localThis = await handleOpenStartChat(document, {
      storage: {
        local: {
          get: vi.fn(async () => ({ extensionPaused: true }))
        }
      }
    });

    expect(localThis).toEqual({ ok: false, reason: 'extension-paused' });
  });
});
