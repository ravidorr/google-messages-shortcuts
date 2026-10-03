import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PAUSE_STORAGE_KEY } from '../../src/shared/pause-preference.js';
import {
  ARCHIVED_FAB_ATTRIBUTE,
  ARCHIVED_FAB_ROW_ATTRIBUTE,
  ARCHIVED_FAB_WRAP_ATTRIBUTE,
  copyArchivedFabIcon,
  createArchivedFab,
  installArchivedFab,
  resetArchivedFabInstallationsForTests,
  syncArchivedFabAppearance
} from '../../src/content/navigation-fab.js';
import {
  createSpamBlockedFab
} from '../../src/content/spam-blocked-fab.js';
import {
  archivedModalSurface,
  archivedSidebarView,
  startChatFabSurface
} from '../fixtures/dom/list-states.js';

describe('navigation-fab', () => {
  beforeEach(() => {
    resetArchivedFabInstallationsForTests(document);
    document.body.innerHTML = '';
    document.head.innerHTML = '';
  });

  it('injects the archived fab in a row beside start chat', async () => {
    document.body.innerHTML = startChatFabSurface;

    const disconnect = installArchivedFab({
      documentRoot: document,
      chromeApi: {
        storage: {
          local: { get: vi.fn(async () => ({})) },
          onChanged: { addListener: vi.fn(), removeListener: vi.fn() }
        }
      },
      openArchived: vi.fn(async () => ({ ok: true }))
    });

    await vi.waitFor(() => {
      expect(document.querySelectorAll(`[${ARCHIVED_FAB_ATTRIBUTE}]`)).toHaveLength(1);
    });

    const row = document.querySelector(`[${ARCHIVED_FAB_ROW_ATTRIBUTE}]`);
    const startChatWrap = row?.querySelector('mw-fab-link.start-chat');
    const archivedWrap = row?.querySelector(`[${ARCHIVED_FAB_WRAP_ATTRIBUTE}]`);

    expect(row?.children).toHaveLength(2);
    expect(startChatWrap?.nextElementSibling).toBe(archivedWrap);
    expect(archivedWrap?.className).toBe('archived-chat');
    expect(archivedWrap?.getAttribute('label')).toBe('Archived');
    expect(archivedWrap?.querySelector('.fab-label')?.textContent).toBe('Archived');
    expect(archivedWrap?.querySelector('a')?.getAttribute('href')).toBe('#');
    expect(archivedWrap?.querySelector('a')?.className)
      .toBe(startChatWrap?.querySelector('a')?.className);
    expect(row?.classList.contains('gm-nav-row')).toBe(true);

    disconnect();
  });

  it('adds tile styles that lay out three equal navigation controls in a grid', async () => {
    document.body.innerHTML = startChatFabSurface;
    const disconnect = installArchivedFab({
      documentRoot: document,
      chromeApi: {
        storage: {
          local: { get: vi.fn(async () => ({})) },
          onChanged: { addListener: vi.fn(), removeListener: vi.fn() }
        }
      }
    });

    await vi.waitFor(() => {
      expect(document.querySelector(`[${ARCHIVED_FAB_ATTRIBUTE}]`)).not.toBeNull();
    });

    const row = document.querySelector(`[${ARCHIVED_FAB_ROW_ATTRIBUTE}]`);
    const styles = document.querySelector('[data-messages-shortcuts-archived-fab-styles]').textContent;

    expect(row?.classList.contains('gm-nav-row')).toBe(true);
    expect(styles).toContain('grid-template-columns: repeat(3, 84px)');
    expect(styles).toContain('padding: 6px 16px 12px');
    expect(styles).toContain('gap: 8px');
    expect(styles).toContain('overflow: visible');
    expect(styles).toContain('height: 72px');
    expect(styles).toContain('width: 84px');
    expect(styles).toContain('flex-direction: column');
    expect(styles).toContain('background: #d3e3fd');
    expect(styles).toContain('background: #f0f4f9');
    expect(styles).toContain('white-space: normal');
    disconnect();
  });

  it('throws when the start chat container is missing its anchor element', () => {
    const startChatContainer = document.createElement('mw-fab-link');
    startChatContainer.className = 'start-chat';

    expect(() => createArchivedFab(document, startChatContainer, vi.fn()))
      .toThrow('Start chat FAB is missing its anchor element.');
  });

  it('uses a fallback archive icon when the start chat icon has not rendered', () => {
    document.body.innerHTML = `
      <mw-fab-link class="start-chat">
        <a class="fab link">
          <mws-icon class="fab-icon"></mws-icon>
          <div class="fab-label">Start chat</div>
        </a>
      </mw-fab-link>
    `;

    const startChatContainer = document.querySelector('mw-fab-link.start-chat');
    const archivedFab = createArchivedFab(document, startChatContainer, vi.fn());

    expect(archivedFab.querySelector('mws-icon.fab-icon svg path')).not.toBeNull();
  });

  it('copies icon and appearance helpers tolerate missing nodes', () => {
    const startChatContainer = document.createElement('mw-fab-link');
    startChatContainer.innerHTML = '<a class="fab"><div class="fab-label">Start chat</div></a>';
    const archivedWrap = document.createElement('mw-fab-link');
    archivedWrap.innerHTML = '<a class="fab"><mws-icon class="fab-icon"></mws-icon></a>';

    expect(() => {
      copyArchivedFabIcon(startChatContainer, archivedWrap);
      syncArchivedFabAppearance(startChatContainer, archivedWrap);
    }).not.toThrow();

    expect(archivedWrap.querySelector('mws-icon.fab-icon svg path')).not.toBeNull();

    copyArchivedFabIcon(startChatContainer, document.createElement('mw-fab-link'));
    syncArchivedFabAppearance(document.createElement('mw-fab-link'), document.createElement('mw-fab-link'));
  });

  it('copies icons even when the rendered source svg has no path element', () => {
    document.body.innerHTML = startChatFabSurface;
    const startChatContainer = document.querySelector('mw-fab-link.start-chat');
    const sourceIcon = startChatContainer.querySelector('mws-icon.fab-icon');
    sourceIcon.innerHTML = '<svg viewBox="0 0 24 24"></svg>';

    const archivedFab = createArchivedFab(document, startChatContainer, vi.fn());

    expect(archivedFab.querySelector('mws-icon.fab-icon svg')).not.toBeNull();
  });

  it('copies icons rendered inside a shadow root', () => {
    document.body.innerHTML = startChatFabSurface;
    const startChatContainer = document.querySelector('mw-fab-link.start-chat');
    const sourceIcon = startChatContainer.querySelector('mws-icon.fab-icon');
    const shadowRoot = sourceIcon.attachShadow({ mode: 'open' });
    shadowRoot.innerHTML = `
      <svg viewBox="0 0 24 24">
        <path d="M20 2H4" fill="currentColor"></path>
      </svg>
    `;
    sourceIcon.replaceChildren();

    const archivedFab = createArchivedFab(document, startChatContainer, vi.fn());

    expect(archivedFab.querySelector('mws-icon.fab-icon svg path')?.getAttribute('d'))
      .toContain('M20.54 5.23');
  });

  it('reuses the existing fab row when reinjecting the archived button', async () => {
    document.body.innerHTML = startChatFabSurface;

    installArchivedFab({
      documentRoot: document,
      chromeApi: {
        storage: {
          local: { get: vi.fn(async () => ({})) },
          onChanged: { addListener: vi.fn(), removeListener: vi.fn() }
        }
      },
      openArchived: vi.fn(async () => ({ ok: false, reason: 'archived-modal-timeout' }))
    });

    await vi.waitFor(() => {
      expect(document.querySelector(`[${ARCHIVED_FAB_ATTRIBUTE}]`)).not.toBeNull();
    });

    const row = document.querySelector(`[${ARCHIVED_FAB_ROW_ATTRIBUTE}]`);
    document.querySelector(`[${ARCHIVED_FAB_WRAP_ATTRIBUTE}]`)?.remove();
    document.body.append(document.createElement('div'));

    await vi.waitFor(() => {
      expect(document.querySelector(`[${ARCHIVED_FAB_ATTRIBUTE}]`)).not.toBeNull();
    });

    expect(document.querySelectorAll(`[${ARCHIVED_FAB_ROW_ATTRIBUTE}]`)).toHaveLength(1);
    expect(row?.querySelector(`[${ARCHIVED_FAB_WRAP_ATTRIBUTE}]`)).not.toBeNull();
  });

  it('creates an archived fab when the start chat label container is missing', () => {
    document.body.innerHTML = `
      <mw-fab-link class="start-chat">
        <a class="fab link"></a>
      </mw-fab-link>
    `;

    const archivedFab = createArchivedFab(
      document,
      document.querySelector('mw-fab-link.start-chat'),
      vi.fn()
    );

    expect(archivedFab.querySelector('.fab-label')).toBeNull();
  });

  it('renders distinct icons and a two-line Spam and blocked label in the tile row', () => {
    document.body.innerHTML = startChatFabSurface;
    const startChatContainer = document.querySelector('mw-fab-link.start-chat');
    const archivedFab = createArchivedFab(document, startChatContainer, vi.fn());
    const spamFab = createSpamBlockedFab(startChatContainer, vi.fn());
    const archivedPath = archivedFab.querySelector('mws-icon.fab-icon path')?.getAttribute('d');
    const spamPath = spamFab.querySelector('mws-icon.fab-icon path')?.getAttribute('d');
    const spamLabel = spamFab.querySelector('.fab-label')?.textContent;

    expect(archivedPath).toContain('M20.54 5.23');
    expect(spamPath).toContain('M12 1L3 5v6');
    expect(archivedPath).not.toBe(spamPath);
    expect(spamLabel).toBe('Spam & blocked');
  });

  it('builds an archived fab that mirrors the start chat button structure', () => {
    document.body.innerHTML = startChatFabSurface;
    const startChatContainer = document.querySelector('mw-fab-link.start-chat');
    const onClick = vi.fn();
    const archivedFab = createArchivedFab(document, startChatContainer, onClick);

    archivedFab.querySelector(`[${ARCHIVED_FAB_ATTRIBUTE}]`).click();

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(archivedFab.className).toBe('archived-chat');
    expect(archivedFab.querySelector('.fab-icon-label-container .fab-label')?.textContent)
      .toBe('Archived');
    expect(archivedFab.querySelector('mws-icon.fab-icon svg path')?.getAttribute('d'))
      .not.toBe('M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z');
  });

  it('removes the archived fab when the extension is paused', async () => {
    document.body.innerHTML = startChatFabSurface;

    installArchivedFab({
      documentRoot: document,
      chromeApi: {
        storage: {
          local: { get: vi.fn(async () => ({ extensionPaused: true })) },
          onChanged: { addListener: vi.fn(), removeListener: vi.fn() }
        }
      }
    });

    await vi.waitFor(() => {
      expect(document.querySelector(`[${ARCHIVED_FAB_ATTRIBUTE}]`)).toBeNull();
    });
  });

  it('does not inject the archived fab when the archived sidebar is already open', async () => {
    document.body.innerHTML = archivedSidebarView;

    installArchivedFab({
      documentRoot: document,
      chromeApi: {
        storage: {
          local: { get: vi.fn(async () => ({})) },
          onChanged: { addListener: vi.fn(), removeListener: vi.fn() }
        }
      }
    });

    await Promise.resolve();

    expect(document.querySelector(`[${ARCHIVED_FAB_ATTRIBUTE}]`)).toBeNull();
  });

  it('injects the archived fab when the modal is already open', async () => {
    document.body.innerHTML = `${startChatFabSurface}${archivedModalSurface}`;

    installArchivedFab({
      documentRoot: document,
      chromeApi: {
        storage: {
          local: { get: vi.fn(async () => ({})) },
          onChanged: { addListener: vi.fn(), removeListener: vi.fn() }
        }
      }
    });

    await Promise.resolve();

    await vi.waitFor(() => {
      expect(document.querySelector(`[${ARCHIVED_FAB_ATTRIBUTE}]`)).not.toBeNull();
    });
  });

  it('keeps the archived fab visible when opening archived fails', async () => {
    document.body.innerHTML = startChatFabSurface;

    installArchivedFab({
      documentRoot: document,
      chromeApi: {
        storage: {
          local: { get: vi.fn(async () => ({})) },
          onChanged: { addListener: vi.fn(), removeListener: vi.fn() }
        }
      },
      openArchived: vi.fn(async () => ({ ok: false, reason: 'archived-modal-timeout' }))
    });

    await vi.waitFor(() => {
      expect(document.querySelector(`[${ARCHIVED_FAB_ATTRIBUTE}]`)).not.toBeNull();
    });

    document.querySelector(`[${ARCHIVED_FAB_ATTRIBUTE}]`).click();
    await Promise.resolve();

    expect(document.querySelector(`[${ARCHIVED_FAB_ATTRIBUTE}]`)).not.toBeNull();
  });

  it('defers fab refresh while an archived open is in progress', async () => {
    document.body.innerHTML = startChatFabSurface;

    installArchivedFab({
      documentRoot: document,
      chromeApi: {
        storage: {
          local: { get: vi.fn(async () => ({})) },
          onChanged: { addListener: vi.fn(), removeListener: vi.fn() }
        }
      },
      openArchived: vi.fn(() => new Promise(() => {}))
    });

    await vi.waitFor(() => {
      expect(document.querySelector(`[${ARCHIVED_FAB_ATTRIBUTE}]`)).not.toBeNull();
    });

    document.querySelector(`[${ARCHIVED_FAB_ATTRIBUTE}]`).click();
    document.body.append(document.createElement('div'));
    await Promise.resolve();

    expect(document.querySelectorAll(`[${ARCHIVED_FAB_ATTRIBUTE}]`)).toHaveLength(1);
  });

  it('ignores repeated clicks while an archived open is in progress', async () => {
    document.body.innerHTML = startChatFabSurface;
    let resolveOpen;
    const openArchived = vi.fn(() => new Promise((resolve) => {
      resolveOpen = resolve;
    }));

    installArchivedFab({
      documentRoot: document,
      chromeApi: {
        storage: {
          local: { get: vi.fn(async () => ({})) },
          onChanged: { addListener: vi.fn(), removeListener: vi.fn() }
        }
      },
      openArchived
    });

    await vi.waitFor(() => {
      expect(document.querySelector(`[${ARCHIVED_FAB_ATTRIBUTE}]`)).not.toBeNull();
    });

    const archivedFab = document.querySelector(`[${ARCHIVED_FAB_ATTRIBUTE}]`);
    archivedFab.click();
    archivedFab.click();

    expect(openArchived).toHaveBeenCalledTimes(1);

    resolveOpen({ ok: false, reason: 'archived-modal-timeout' });
    await Promise.resolve();
  });

  it('keeps the archived fab visible when archived opens without a modal', async () => {
    document.body.innerHTML = startChatFabSurface;

    installArchivedFab({
      documentRoot: document,
      chromeApi: {
        storage: {
          local: { get: vi.fn(async () => ({})) },
          onChanged: { addListener: vi.fn(), removeListener: vi.fn() }
        }
      },
      openArchived: vi.fn(async () => ({
        ok: true,
        reason: 'archived-sidebar-only',
        openedRoute: true
      }))
    });

    await vi.waitFor(() => {
      expect(document.querySelector(`[${ARCHIVED_FAB_ATTRIBUTE}]`)).not.toBeNull();
    });

    document.querySelector(`[${ARCHIVED_FAB_ATTRIBUTE}]`).click();
    await Promise.resolve();

    expect(document.querySelector(`[${ARCHIVED_FAB_ATTRIBUTE}]`)).not.toBeNull();
  });

  it('removes the archived fab when the sidebar route becomes active', async () => {
    document.body.innerHTML = startChatFabSurface;
    const openArchived = vi.fn(async () => {
      document.body.insertAdjacentHTML('beforeend', archivedSidebarView);

      return {
        ok: true,
        reason: 'archived-sidebar-only',
        openedRoute: true
      };
    });

    installArchivedFab({
      documentRoot: document,
      chromeApi: {
        storage: {
          local: { get: vi.fn(async () => ({})) },
          onChanged: { addListener: vi.fn(), removeListener: vi.fn() }
        }
      },
      openArchived
    });

    await vi.waitFor(() => {
      expect(document.querySelector(`[${ARCHIVED_FAB_ATTRIBUTE}]`)).not.toBeNull();
    });

    document.querySelector(`[${ARCHIVED_FAB_ATTRIBUTE}]`).click();
    await Promise.resolve();

    expect(openArchived).toHaveBeenCalledTimes(1);
    expect(document.querySelector(`[${ARCHIVED_FAB_ATTRIBUTE}]`)).toBeNull();
  });

  it('opens archived when the injected fab receives Enter', async () => {
    document.body.innerHTML = startChatFabSurface;
    const openArchived = vi.fn(async () => ({ ok: true }));

    installArchivedFab({
      documentRoot: document,
      chromeApi: {
        storage: {
          local: { get: vi.fn(async () => ({})) },
          onChanged: { addListener: vi.fn(), removeListener: vi.fn() }
        }
      },
      openArchived
    });

    await vi.waitFor(() => {
      expect(document.querySelector(`[${ARCHIVED_FAB_ATTRIBUTE}]`)).not.toBeNull();
    });

    document.querySelector(`[${ARCHIVED_FAB_ATTRIBUTE}]`).dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true
    }));
    await Promise.resolve();

    expect(openArchived).toHaveBeenCalledTimes(1);
  });

  it('ignores unrelated key presses on the injected fab', async () => {
    document.body.innerHTML = startChatFabSurface;
    const openArchived = vi.fn(async () => ({ ok: true }));

    installArchivedFab({
      documentRoot: document,
      chromeApi: {
        storage: {
          local: { get: vi.fn(async () => ({})) },
          onChanged: { addListener: vi.fn(), removeListener: vi.fn() }
        }
      },
      openArchived
    });

    await vi.waitFor(() => {
      expect(document.querySelector(`[${ARCHIVED_FAB_ATTRIBUTE}]`)).not.toBeNull();
    });

    document.querySelector(`[${ARCHIVED_FAB_ATTRIBUTE}]`).dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true
    }));
    await Promise.resolve();

    expect(openArchived).not.toHaveBeenCalled();
  });

  it('opens archived when the injected fab receives Space', async () => {
    document.body.innerHTML = startChatFabSurface;
    const openArchived = vi.fn(async () => ({ ok: true }));

    installArchivedFab({
      documentRoot: document,
      chromeApi: {
        storage: {
          local: { get: vi.fn(async () => ({})) },
          onChanged: { addListener: vi.fn(), removeListener: vi.fn() }
        }
      },
      openArchived
    });

    await vi.waitFor(() => {
      expect(document.querySelector(`[${ARCHIVED_FAB_ATTRIBUTE}]`)).not.toBeNull();
    });

    document.querySelector(`[${ARCHIVED_FAB_ATTRIBUTE}]`).dispatchEvent(new KeyboardEvent('keydown', {
      key: ' ',
      bubbles: true
    }));
    await Promise.resolve();

    expect(openArchived).toHaveBeenCalledTimes(1);
  });

  it('keeps the archived fab visible when the injected fab opens the modal', async () => {
    document.body.innerHTML = startChatFabSurface;
    const openArchived = vi.fn(async () => {
      document.body.insertAdjacentHTML('beforeend', archivedModalSurface);

      return { ok: true };
    });

    installArchivedFab({
      documentRoot: document,
      chromeApi: {
        storage: {
          local: { get: vi.fn(async () => ({})) },
          onChanged: { addListener: vi.fn(), removeListener: vi.fn() }
        }
      },
      openArchived
    });

    await vi.waitFor(() => {
      expect(document.querySelector(`[${ARCHIVED_FAB_ATTRIBUTE}]`)).not.toBeNull();
    });

    document.querySelector(`[${ARCHIVED_FAB_ATTRIBUTE}]`).click();
    await Promise.resolve();

    expect(openArchived).toHaveBeenCalledTimes(1);
    expect(document.querySelector(`[${ARCHIVED_FAB_ATTRIBUTE}]`)).not.toBeNull();
  });

  it('reuses an existing fab installation until the last listener disconnects', async () => {
    document.body.innerHTML = startChatFabSurface;
    const chromeApi = {
      storage: {
        local: { get: vi.fn(async () => ({})) },
        onChanged: { addListener: vi.fn(), removeListener: vi.fn() }
      }
    };

    const disconnectA = installArchivedFab({ documentRoot: document, chromeApi });
    const disconnectB = installArchivedFab({ documentRoot: document, chromeApi });

    await vi.waitFor(() => {
      expect(document.querySelectorAll(`[${ARCHIVED_FAB_ATTRIBUTE}]`)).toHaveLength(1);
    });

    disconnectA();
    expect(chromeApi.storage.onChanged.removeListener).not.toHaveBeenCalled();

    disconnectB();
    expect(chromeApi.storage.onChanged.removeListener).toHaveBeenCalled();
  });

  it('reacts to pause preference changes and tears down shared installations', async () => {
    document.body.innerHTML = startChatFabSurface;
    let pauseListener;
    const chromeApi = {
      storage: {
        local: { get: vi.fn(async () => ({})) },
        onChanged: {
          addListener: vi.fn((listener) => {
            pauseListener = listener;
          }),
          removeListener: vi.fn()
        }
      }
    };

    const disconnectA = installArchivedFab({ documentRoot: document, chromeApi });
    const disconnectB = installArchivedFab({ documentRoot: document, chromeApi });

    await vi.waitFor(() => {
      expect(document.querySelector(`[${ARCHIVED_FAB_ATTRIBUTE}]`)).not.toBeNull();
    });

    pauseListener({ [PAUSE_STORAGE_KEY]: { newValue: true } }, 'local');

    expect(document.querySelector(`[${ARCHIVED_FAB_ATTRIBUTE}]`)).toBeNull();

    pauseListener({ [PAUSE_STORAGE_KEY]: { newValue: false } }, 'local');

    await vi.waitFor(() => {
      expect(document.querySelector(`[${ARCHIVED_FAB_ATTRIBUTE}]`)).not.toBeNull();
    });

    disconnectA();
    expect(document.querySelector(`[${ARCHIVED_FAB_ATTRIBUTE}]`)).not.toBeNull();

    disconnectB();
    expect(document.querySelector(`[${ARCHIVED_FAB_ATTRIBUTE}]`)).toBeNull();
    expect(chromeApi.storage.onChanged.removeListener).toHaveBeenCalled();

    resetArchivedFabInstallationsForTests(document);
  });

  it('ignores unrelated pause preference events', async () => {
    document.body.innerHTML = startChatFabSurface;
    let pauseListener;

    installArchivedFab({
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
      }
    });

    await vi.waitFor(() => {
      expect(document.querySelector(`[${ARCHIVED_FAB_ATTRIBUTE}]`)).not.toBeNull();
    });

    pauseListener({}, 'sync');
    pauseListener({ unrelated: { newValue: true } }, 'local');

    expect(document.querySelector(`[${ARCHIVED_FAB_ATTRIBUTE}]`)).not.toBeNull();
  });

  it('waits for initialization before injecting the archived fab', async () => {
    document.body.innerHTML = startChatFabSurface;
    let resolvePaused;

    installArchivedFab({
      documentRoot: document,
      chromeApi: {
        storage: {
          onChanged: { addListener: vi.fn(), removeListener: vi.fn() }
        }
      },
      getPausedState: () => new Promise((resolve) => {
        resolvePaused = resolve;
      })
    });

    document.body.append(document.createElement('div'));
    expect(document.querySelector(`[${ARCHIVED_FAB_ATTRIBUTE}]`)).toBeNull();

    resolvePaused(false);

    await vi.waitFor(() => {
      expect(document.querySelector(`[${ARCHIVED_FAB_ATTRIBUTE}]`)).not.toBeNull();
    });
  });

  it('defaults paused state when extension storage is unavailable', async () => {
    document.body.innerHTML = startChatFabSurface;

    installArchivedFab({
      documentRoot: document,
      chromeApi: { storage: { local: {} } }
    });

    await vi.waitFor(() => {
      expect(document.querySelector(`[${ARCHIVED_FAB_ATTRIBUTE}]`)).not.toBeNull();
    });
  });

  it('skips fab injection when the start chat container has no parent', async () => {
    document.body.innerHTML = '';
    const startChatContainer = document.createElement('mw-fab-link');
    startChatContainer.className = 'start-chat';
    startChatContainer.innerHTML = '<a data-e2e-start-button>Start chat</a>';
    document.body.append(startChatContainer);
    startChatContainer.remove();

    installArchivedFab({
      documentRoot: document,
      chromeApi: {
        storage: {
          local: { get: vi.fn(async () => ({})) },
          onChanged: { addListener: vi.fn(), removeListener: vi.fn() }
        }
      }
    });

    await Promise.resolve();

    expect(document.querySelector(`[${ARCHIVED_FAB_ATTRIBUTE}]`)).toBeNull();
  });

  it('ignores extension-owned mutations when refreshing the archived fab', async () => {
    document.body.innerHTML = startChatFabSurface;

    installArchivedFab({
      documentRoot: document,
      chromeApi: {
        storage: {
          local: { get: vi.fn(async () => ({})) },
          onChanged: { addListener: vi.fn(), removeListener: vi.fn() }
        }
      }
    });

    await vi.waitFor(() => {
      expect(document.querySelector(`[${ARCHIVED_FAB_ATTRIBUTE}]`)).not.toBeNull();
    });

    const archivedLabel = document.querySelector(`[${ARCHIVED_FAB_WRAP_ATTRIBUTE}] .fab-label`);
    archivedLabel.textContent = 'Archived ';

    await Promise.resolve();

    expect(document.querySelectorAll(`[${ARCHIVED_FAB_ATTRIBUTE}]`)).toHaveLength(1);
  });

  it('unwraps the start chat container when the archived fab is removed', async () => {
    document.body.innerHTML = startChatFabSurface;

    const disconnect = installArchivedFab({
      documentRoot: document,
      chromeApi: {
        storage: {
          local: { get: vi.fn(async () => ({})) },
          onChanged: { addListener: vi.fn(), removeListener: vi.fn() }
        }
      }
    });

    await vi.waitFor(() => {
      expect(document.querySelector(`[${ARCHIVED_FAB_ROW_ATTRIBUTE}]`)).not.toBeNull();
    });

    disconnect();

    expect(document.querySelector(`[${ARCHIVED_FAB_ROW_ATTRIBUTE}]`)).toBeNull();
    expect(document.querySelector('mw-fab-link.start-chat')?.parentElement).toBe(document.body);
  });

  it('handles orphaned fab rows during teardown', async () => {
    document.body.innerHTML = startChatFabSurface;

    const disconnect = installArchivedFab({
      documentRoot: document,
      chromeApi: {
        storage: {
          local: { get: vi.fn(async () => ({})) },
          onChanged: { addListener: vi.fn(), removeListener: vi.fn() }
        }
      }
    });

    await vi.waitFor(() => {
      expect(document.querySelector(`[${ARCHIVED_FAB_ROW_ATTRIBUTE}]`)).not.toBeNull();
    });

    document.querySelector(`[${ARCHIVED_FAB_ROW_ATTRIBUTE}]`)?.remove();

    expect(() => disconnect()).not.toThrow();
  });
});
