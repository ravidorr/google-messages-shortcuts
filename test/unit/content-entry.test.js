import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('content entry helpers', () => {
  beforeEach(async () => {
    vi.resetModules();
    document.body.innerHTML = '<mws-conversation-list-item is-focused="true"></mws-conversation-list-item>';
    globalThis.MessagesShortcuts = undefined;
    globalThis.chrome = {
      runtime: {
        onMessage: {
          addListener: vi.fn()
        },
        sendMessage: vi.fn(async () => ({
          archive: 'Ctrl+Shift+Y',
          trash: 'Ctrl+Shift+D'
        }))
      }
    };
    await import('../../content.js');
  });

  it('exposes handleCommand on the test namespace', async () => {
    expect(typeof globalThis.MessagesShortcuts.handleCommand).toBe('function');
    expect(typeof globalThis.MessagesShortcuts.runConversationAction).toBe('function');
  });

  it('registers the runtime message listener', () => {
    expect(globalThis.chrome.runtime.onMessage.addListener).toHaveBeenCalled();
  });

  it('installs shortcut pills for the focused conversation row', async () => {
    await vi.waitFor(() => {
      expect(
        document.querySelectorAll('[data-messages-shortcuts-pill]')
      ).toHaveLength(2);
    });
  });
});
