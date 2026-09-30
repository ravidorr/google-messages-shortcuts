import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('content entry helpers', () => {
  beforeEach(async () => {
    vi.resetModules();
    document.body.innerHTML = '';
    globalThis.MessagesShortcuts = undefined;
    globalThis.chrome = {
      runtime: {
        onMessage: {
          addListener: vi.fn()
        }
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
});
