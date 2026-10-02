import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PAUSE_STORAGE_KEY } from '../../src/shared/pause-preference.js';
import {
  installNavigationShortcuts,
  resetNavigationShortcutInstallationsForTests
} from '../../src/content/navigation-shortcuts.js';
import { archivedModalSurface } from '../fixtures/dom/list-states.js';

describe('navigation-shortcuts', () => {
  beforeEach(() => {
    resetNavigationShortcutInstallationsForTests(document);
    document.body.innerHTML = '';
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
      openArchived: vi.fn(async () => ({ ok: true }))
    });

    pauseListener({}, 'sync');
    pauseListener({ unrelated: { newValue: true } }, 'local');

    expect(pauseListener).toBeTypeOf('function');
  });
});
