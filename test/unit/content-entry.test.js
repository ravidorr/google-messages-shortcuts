import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installPageWorldBridgeMain } from '../../page-world-bridge-main.js';
import { MARK_AS_READ_DEBUG_VALIDATION_STORAGE_KEY } from '../../src/shared/mark-as-read-debug-preference.js';

function createChromeApi() {
  const listeners = [];
  const storageListeners = [];

  return {
    runtime: {
      onMessage: {
        addListener: vi.fn((listener) => {
          listeners.push(listener);
        }),
        removeListener: vi.fn((listener) => {
          const listenerIndex = listeners.indexOf(listener);

          if (listenerIndex >= 0) {
            listeners.splice(listenerIndex, 1);
          }
        }),
        listenerCount: () => listeners.length
      },
      sendMessage: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D',
        markRead: 'Ctrl+Shift+K',
        markUnread: 'Ctrl+Shift+U'
      }))
    },
    storage: {
      local: {
        get: vi.fn(async () => ({}))
      },
      onChanged: {
        addListener: vi.fn((listener) => {
          storageListeners.push(listener);
        }),
        removeListener: vi.fn((listener) => {
          const listenerIndex = storageListeners.indexOf(listener);

          if (listenerIndex >= 0) {
            storageListeners.splice(listenerIndex, 1);
          }
        }),
        listenerCount: () => storageListeners.length
      }
    }
  };
}

describe('content entry helpers', () => {
  let resetContentScriptForTests;

  afterEach(async () => {
    if (resetContentScriptForTests) {
      resetContentScriptForTests();
    }

    vi.resetModules();
    document.body.innerHTML = '';
    globalThis.MessagesShortcuts = undefined;
  });

  beforeEach(async () => {
    document.body.innerHTML = '<mws-conversation-list-item is-focused="true"></mws-conversation-list-item>';
    globalThis.MessagesShortcuts = undefined;
    globalThis.chrome = createChromeApi();

    const contentModule = await import('../../content.js');
    resetContentScriptForTests = contentModule.resetContentScriptForTests;
  });

  it('exposes handleCommand on the test namespace', () => {
    expect(typeof globalThis.MessagesShortcuts.handleCommand).toBe('function');
    expect(typeof globalThis.MessagesShortcuts.runConversationAction).toBe('function');
    expect(typeof globalThis.MessagesShortcuts.runCapabilitySelfTest).toBe('function');
  });

  it('routes runMarkAsReadLiveValidation through the content script bridge host', async () => {
    resetContentScriptForTests();
    vi.resetModules();
    globalThis.MessagesShortcuts = undefined;
    globalThis.chrome = createChromeApi();
    globalThis.chrome.storage.local.get = vi.fn(async () => ({
      [MARK_AS_READ_DEBUG_VALIDATION_STORAGE_KEY]: false
    }));

    await import('../../content.js');
    installPageWorldBridgeMain(document, globalThis);

    await expect(globalThis.MessagesShortcuts.runMarkAsReadLiveValidation()).resolves.toMatchObject({
      ok: false,
      error: 'debug-validation-disabled'
    });
  });

  it('registers exactly one runtime message listener per content script load', () => {
    expect(globalThis.chrome.runtime.onMessage.addListener).toHaveBeenCalledTimes(1);
    expect(globalThis.chrome.runtime.onMessage.listenerCount()).toBe(1);
  });

  it('preserves existing test namespace properties', async () => {
    resetContentScriptForTests();
    vi.resetModules();
    globalThis.MessagesShortcuts = { existingProperty: true };
    globalThis.chrome = createChromeApi();

    await import('../../content.js');

    expect(globalThis.MessagesShortcuts).toMatchObject({
      existingProperty: true,
      handleCommand: expect.any(Function),
      runConversationAction: expect.any(Function),
      runCapabilitySelfTest: expect.any(Function)
    });
  });

  it('installs shortcut pills for the focused conversation row', async () => {
    await vi.waitFor(() => {
      expect(
        document.querySelectorAll('[data-messages-shortcuts-pill]')
      ).toHaveLength(6);
    });
    expect(document.querySelector('[data-messages-shortcuts-navigation-tile-styles]'))
      .not.toBeNull();
  });

  it('cleans up listeners, observers, and pills before reloading the content script', async () => {
    await vi.waitFor(() => {
      expect(
        document.querySelectorAll('[data-messages-shortcuts-pill]')
      ).toHaveLength(6);
    });

    resetContentScriptForTests();
    expect(globalThis.chrome.runtime.onMessage.listenerCount()).toBe(0);
    expect(document.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(0);
    expect(document.querySelector('[data-messages-shortcuts-navigation-tile-styles]'))
      .toBeNull();

    vi.resetModules();
    document.body.innerHTML = '<mws-conversation-list-item is-focused="true"></mws-conversation-list-item>';
    globalThis.chrome = createChromeApi();

    await import('../../content.js');

    expect(globalThis.chrome.runtime.onMessage.addListener).toHaveBeenCalledTimes(1);
    expect(globalThis.chrome.runtime.onMessage.listenerCount()).toBe(1);

    await vi.waitFor(() => {
      expect(
        document.querySelectorAll('[data-messages-shortcuts-pill]')
      ).toHaveLength(6);
    });
  });
});
