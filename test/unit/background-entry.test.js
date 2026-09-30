import { describe, expect, it, vi } from 'vitest';
import { COMMAND_ARCHIVE } from '../../src/shared/commands.js';

describe('background entry', () => {
  it('registers the command listener', async () => {
    vi.resetModules();

    const addListener = vi.fn();
    globalThis.chrome = {
      commands: {
        onCommand: {
          addListener
        }
      },
      tabs: {
        query: vi.fn(async () => [{
          id: 1,
          url: 'https://messages.google.com/web/conversations'
        }]),
        sendMessage: vi.fn(async () => ({ ok: true }))
      }
    };

    await import('../../background.js');

    expect(addListener).toHaveBeenCalledTimes(1);

    const listener = addListener.mock.calls[0][0];
    await listener(COMMAND_ARCHIVE);

    expect(globalThis.chrome.tabs.sendMessage).toHaveBeenCalled();
  });
});
