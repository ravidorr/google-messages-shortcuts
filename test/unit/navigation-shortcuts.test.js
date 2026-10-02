import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PAUSE_STORAGE_KEY } from '../../src/shared/pause-preference.js';
import {
  matchesOpenArchivedShortcut,
  matchesStartChatShortcut
} from '../../src/shared/navigation-shortcut-bindings.js';
import { resetOpenStartChatInFlightForTests } from '../../src/content/adapters/start-chat-adapter.js';
import {
  openArchivedModal,
  resetOpenArchivedModalInFlightForTests
} from '../../src/content/adapters/archived-adapter.js';
import {
  installNavigationShortcuts,
  resetNavigationShortcutInstallationsForTests
} from '../../src/content/navigation-shortcuts.js';
import * as openStartChatAction from '../../src/content/open-start-chat-action.js';
import { archivedEntryControl, archivedModalSurface } from '../fixtures/dom/list-states.js';

describe('navigation-shortcuts', () => {
  beforeEach(() => {
    resetNavigationShortcutInstallationsForTests(document);
    resetOpenArchivedModalInFlightForTests();
    resetOpenStartChatInFlightForTests();
    document.body.innerHTML = '';
  });

  it('opens archived from the Mac page-level shortcut', async () => {
    const openArchived = vi.fn(async () => ({ ok: true }));

    installNavigationShortcuts({
      documentRoot: document,
      chromeApi: {
        storage: {
          local: { get: vi.fn(async () => ({})) },
          onChanged: { addListener: vi.fn(), removeListener: vi.fn() }
        }
      },
      openArchived,
      matchesArchivedShortcut: (event) => matchesOpenArchivedShortcut(event, 'MacIntel')
    });

    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'a',
      metaKey: true,
      shiftKey: true,
      ctrlKey: false,
      bubbles: true
    }));

    await Promise.resolve();

    expect(openArchived).toHaveBeenCalledWith(document, expect.any(Object), expect.any(Object));
  });

  it('opens archived from the page-level shortcut', async () => {
    const openArchived = vi.fn(async () => ({ ok: true }));

    installNavigationShortcuts({
      documentRoot: document,
      chromeApi: {
        storage: {
          local: { get: vi.fn(async () => ({})) },
          onChanged: { addListener: vi.fn(), removeListener: vi.fn() }
        }
      },
      openArchived
    });

    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'a',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true
    }));

    await Promise.resolve();

    expect(openArchived).toHaveBeenCalledWith(document, expect.any(Object), expect.any(Object));
  });

  it('ignores the shortcut inside editable fields', async () => {
    const openArchived = vi.fn(async () => ({ ok: true }));

    document.body.innerHTML = '<textarea id="composer"></textarea>';
    installNavigationShortcuts({
      documentRoot: document,
      chromeApi: {
        storage: {
          local: { get: vi.fn(async () => ({})) },
          onChanged: { addListener: vi.fn(), removeListener: vi.fn() }
        }
      },
      openArchived
    });

    document.getElementById('composer').dispatchEvent(new KeyboardEvent('keydown', {
      key: 'a',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true
    }));

    await Promise.resolve();

    expect(openArchived).not.toHaveBeenCalled();
  });

  it('ignores the shortcut when the archived dialog shell is already open', async () => {
    document.body.innerHTML = `
      <mat-dialog-container>
        <h2>Archived</h2>
      </mat-dialog-container>
    `;
    const openArchived = vi.fn(async () => ({ ok: true }));

    installNavigationShortcuts({
      documentRoot: document,
      chromeApi: {
        storage: {
          local: { get: vi.fn(async () => ({})) },
          onChanged: { addListener: vi.fn(), removeListener: vi.fn() }
        }
      },
      openArchived
    });

    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'a',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true
    }));

    await Promise.resolve();

    expect(openArchived).not.toHaveBeenCalled();
  });

  it('ignores the shortcut when the archived modal is already open', async () => {
    document.body.innerHTML = archivedModalSurface;
    const openArchived = vi.fn(async () => ({ ok: true }));

    installNavigationShortcuts({
      documentRoot: document,
      chromeApi: {
        storage: {
          local: { get: vi.fn(async () => ({})) },
          onChanged: { addListener: vi.fn(), removeListener: vi.fn() }
        }
      },
      openArchived
    });

    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'a',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true
    }));

    await Promise.resolve();

    expect(openArchived).not.toHaveBeenCalled();
  });

  it('ignores shortcuts while paused and supports shared teardown', async () => {
    let pauseListener;
    let paused = true;
    const openArchived = vi.fn(async () => ({ ok: true }));
    const chromeApi = {
      storage: {
        local: { get: vi.fn(async () => ({ extensionPaused: paused })) },
        onChanged: {
          addListener: vi.fn((listener) => {
            pauseListener = listener;
          }),
          removeListener: vi.fn()
        }
      }
    };

    const disconnectA = installNavigationShortcuts({
      documentRoot: document,
      chromeApi,
      openArchived,
      getPausedState: async () => paused
    });
    const disconnectB = installNavigationShortcuts({
      documentRoot: document,
      chromeApi,
      openArchived,
      getPausedState: async () => paused
    });

    await Promise.resolve();

    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'a',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true
    }));

    expect(openArchived).not.toHaveBeenCalled();

    paused = false;
    pauseListener({ [PAUSE_STORAGE_KEY]: { newValue: false } }, 'local');

    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'a',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true
    }));

    await Promise.resolve();

    expect(openArchived).toHaveBeenCalledTimes(1);

    disconnectA();
    expect(chromeApi.storage.onChanged.removeListener).not.toHaveBeenCalled();

    disconnectB();
    expect(chromeApi.storage.onChanged.removeListener).toHaveBeenCalled();

    resetNavigationShortcutInstallationsForTests(document);
  });

  it('defaults paused state to false when storage is unavailable', async () => {
    const openArchived = vi.fn(async () => ({ ok: true }));

    installNavigationShortcuts({
      documentRoot: document,
      chromeApi: { storage: { local: {} } },
      openArchived
    });

    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'a',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true
    }));

    await Promise.resolve();

    expect(openArchived).toHaveBeenCalledTimes(1);
  });

  it('reuses an existing shortcut installation until the last listener disconnects', async () => {
    const chromeApi = {
      storage: {
        onChanged: { addListener: vi.fn(), removeListener: vi.fn() }
      }
    };
    const disconnectA = installNavigationShortcuts({ documentRoot: document, chromeApi });
    const disconnectB = installNavigationShortcuts({ documentRoot: document, chromeApi });

    disconnectA();
    expect(chromeApi.storage.onChanged.removeListener).not.toHaveBeenCalled();

    disconnectB();
    expect(chromeApi.storage.onChanged.removeListener).toHaveBeenCalled();
  });

  it('ignores unrelated pause preference events', async () => {
    let pauseListener;
    const openArchived = vi.fn(async () => ({ ok: true }));

    installNavigationShortcuts({
      documentRoot: document,
      chromeApi: {
        storage: {
          onChanged: {
            addListener: vi.fn((listener) => {
              pauseListener = listener;
            }),
            removeListener: vi.fn()
          }
        }
      },
      openArchived
    });

    pauseListener({}, 'sync');
    pauseListener({ unrelated: { newValue: true } }, 'local');

    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'a',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true
    }));

    await Promise.resolve();

    expect(openArchived).toHaveBeenCalledTimes(1);
  });

  it('ignores the shortcut while open archived is already in progress', async () => {
    document.body.innerHTML = archivedEntryControl;

    let resolveWait;
    const waitPromise = new Promise((resolve) => {
      resolveWait = resolve;
    });
    const results = [];

    installNavigationShortcuts({
      documentRoot: document,
      chromeApi: {
        storage: {
          local: { get: vi.fn(async () => ({})) },
          onChanged: { addListener: vi.fn(), removeListener: vi.fn() }
        }
      },
      openArchived: async (documentRoot, chromeApi, selectors) => {
        const result = await openArchivedModal(
          documentRoot,
          selectors,
          () => waitPromise
        );
        results.push(result);
        return result;
      }
    });

    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'a',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true
    }));
    await Promise.resolve();

    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'a',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true
    }));
    await Promise.resolve();

    expect(results).toEqual([{ ok: false, reason: 'action-in-progress' }]);

    resolveWait(document.querySelector('mat-dialog-container'));
    await Promise.resolve();
  });

  it('opens start chat from the page-level shortcut', async () => {
    const openStartChat = vi.fn(async () => ({ ok: true }));

    installNavigationShortcuts({
      documentRoot: document,
      chromeApi: {
        storage: {
          local: { get: vi.fn(async () => ({})) },
          onChanged: { addListener: vi.fn(), removeListener: vi.fn() }
        }
      },
      openStartChat
    });

    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'n',
      ctrlKey: true,
      altKey: true,
      shiftKey: false,
      bubbles: true
    }));

    await Promise.resolve();

    expect(openStartChat).toHaveBeenCalledWith(document, expect.any(Object), expect.any(Object));
  });

  it('ignores start chat when a native dialog is open', async () => {
    document.body.innerHTML = '<mat-dialog-container></mat-dialog-container>';
    const openStartChat = vi.fn(async () => ({ ok: true }));

    installNavigationShortcuts({
      documentRoot: document,
      chromeApi: {
        storage: {
          local: { get: vi.fn(async () => ({})) },
          onChanged: { addListener: vi.fn(), removeListener: vi.fn() }
        }
      },
      openStartChat
    });

    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'n',
      ctrlKey: true,
      altKey: true,
      shiftKey: false,
      bubbles: true
    }));

    await Promise.resolve();

    expect(openStartChat).not.toHaveBeenCalled();
  });

  it('shows start chat feedback from the default installation path', async () => {
    vi.spyOn(openStartChatAction, 'handleOpenStartChat')
      .mockResolvedValueOnce({ ok: true });

    installNavigationShortcuts({
      documentRoot: document,
      chromeApi: {
        storage: {
          local: { get: vi.fn(async () => ({})) },
          onChanged: { addListener: vi.fn(), removeListener: vi.fn() }
        }
      }
    });

    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'n',
      ctrlKey: true,
      altKey: true,
      shiftKey: false,
      bubbles: true
    }));

    await Promise.resolve();

    expect(openStartChatAction.handleOpenStartChat).toHaveBeenCalled();
  });

  it('ignores start chat while paused', async () => {
    let pauseListener;
    let paused = true;
    const openStartChat = vi.fn(async () => ({ ok: true }));
    const chromeApi = {
      storage: {
        local: { get: vi.fn(async () => ({ extensionPaused: paused })) },
        onChanged: {
          addListener: vi.fn((listener) => {
            pauseListener = listener;
          }),
          removeListener: vi.fn()
        }
      }
    };

    installNavigationShortcuts({
      documentRoot: document,
      chromeApi,
      openStartChat,
      getPausedState: async () => paused
    });

    await Promise.resolve();

    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'n',
      ctrlKey: true,
      altKey: true,
      shiftKey: false,
      bubbles: true
    }));

    expect(openStartChat).not.toHaveBeenCalled();

    paused = false;
    pauseListener({ [PAUSE_STORAGE_KEY]: { newValue: false } }, 'local');

    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'n',
      ctrlKey: true,
      altKey: true,
      shiftKey: false,
      bubbles: true
    }));

    await Promise.resolve();

    expect(openStartChat).toHaveBeenCalledTimes(1);
  });

  it('ignores keydown events that do not match a navigation shortcut', async () => {
    const openArchived = vi.fn(async () => ({ ok: true }));
    const openStartChat = vi.fn(async () => ({ ok: true }));

    installNavigationShortcuts({
      documentRoot: document,
      chromeApi: {
        storage: {
          local: { get: vi.fn(async () => ({})) },
          onChanged: { addListener: vi.fn(), removeListener: vi.fn() }
        }
      },
      openArchived,
      openStartChat,
      matchesArchivedShortcut: () => false,
      matchesStartChat: () => false
    });

    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'n',
      ctrlKey: true,
      altKey: true,
      shiftKey: false,
      bubbles: true
    }));

    await Promise.resolve();

    expect(openArchived).not.toHaveBeenCalled();
    expect(openStartChat).not.toHaveBeenCalled();
  });

  it('opens start chat from the Mac page-level shortcut', async () => {
    const openStartChat = vi.fn(async () => ({ ok: true }));

    installNavigationShortcuts({
      documentRoot: document,
      chromeApi: {
        storage: {
          local: { get: vi.fn(async () => ({})) },
          onChanged: { addListener: vi.fn(), removeListener: vi.fn() }
        }
      },
      openStartChat,
      matchesStartChat: (event) => matchesStartChatShortcut(event, 'MacIntel')
    });

    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'n',
      metaKey: true,
      altKey: true,
      shiftKey: false,
      ctrlKey: false,
      bubbles: true
    }));

    await Promise.resolve();

    expect(openStartChat).toHaveBeenCalledWith(document, expect.any(Object), expect.any(Object));
  });
});
