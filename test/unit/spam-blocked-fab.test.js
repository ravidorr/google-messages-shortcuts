import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ARCHIVED_FAB_ROW_ATTRIBUTE
} from '../../src/content/navigation-fab.js';
import {
  createSpamBlockedFab,
  installSpamBlockedFab,
  resetSpamBlockedFabInstallationsForTests,
  SPAM_BLOCKED_FAB_ATTRIBUTE,
  SPAM_BLOCKED_FAB_WRAP_ATTRIBUTE
} from '../../src/content/spam-blocked-fab.js';
import { startChatFabSurface } from '../fixtures/dom/list-states.js';

function createChromeApi(paused = false) {
  return {
    storage: {
      local: { get: vi.fn(async () => ({ extensionPaused: paused })) },
      onChanged: { addListener: vi.fn(), removeListener: vi.fn() }
    }
  };
}

describe('spam-blocked-fab', () => {
  beforeEach(() => {
    resetSpamBlockedFabInstallationsForTests(document);
    document.body.innerHTML = '';
    document.head.innerHTML = '';
  });

  afterEach(() => {
    resetSpamBlockedFabInstallationsForTests(document);
    vi.restoreAllMocks();
  });

  it('creates an accessible Spam and blocked FAB and activates it by mouse or keyboard', async () => {
    document.body.innerHTML = startChatFabSurface;
    const localThis = vi.fn(async () => {});
    const startChatContainer = document.querySelector('mw-fab-link.start-chat');
    const fab = createSpamBlockedFab(startChatContainer, localThis);
    const link = fab.querySelector(`[${SPAM_BLOCKED_FAB_ATTRIBUTE}]`);

    expect(fab.className).toBe('spam-blocked-chat');
    expect(fab.getAttribute(SPAM_BLOCKED_FAB_WRAP_ATTRIBUTE)).toBe('');
    expect(link).toMatchObject({ role: 'button', tabIndex: 0 });
    expect(link.getAttribute('aria-label')).toBe('Open Spam and blocked');
    expect(link.getAttribute('data-e2e-start-button')).toBeNull();
    expect(fab.querySelector('.fab-label').textContent).toBe('Spam & blocked');
    expect(fab.querySelector('mws-icon.fab-icon path').getAttribute('d'))
      .toContain('M12 1L3 5v6');
    expect(fab.querySelector('mws-icon.fab-icon path').getAttribute('d'))
      .not.toContain('M20.54 5.23');

    link.click();
    link.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    link.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    link.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    await Promise.resolve();

    expect(localThis).toHaveBeenCalledTimes(3);
  });

  it('throws when the source start-chat FAB has no link', () => {
    const localThis = document.createElement('mw-fab-link');

    expect(() => createSpamBlockedFab(localThis, vi.fn()))
      .toThrow('Start chat FAB is missing its anchor element.');
  });

  it('injects beside the archived FAB row and removes itself during teardown', async () => {
    document.body.innerHTML = `<div ${ARCHIVED_FAB_ROW_ATTRIBUTE}>${startChatFabSurface}</div>`;
    const chromeApi = createChromeApi();
    const disconnect = installSpamBlockedFab({
      documentRoot: document,
      chromeApi,
      openSpamBlocked: vi.fn(async () => ({ ok: false, reason: 'spam-blocked-dialog-timeout' }))
    });

    await vi.waitFor(() => {
      expect(document.querySelector(`[${SPAM_BLOCKED_FAB_ATTRIBUTE}]`)).not.toBeNull();
    });
    expect(document.querySelector(`[${ARCHIVED_FAB_ROW_ATTRIBUTE}]`).children).toHaveLength(2);

    disconnect();

    expect(document.querySelector(`[${SPAM_BLOCKED_FAB_ATTRIBUTE}]`)).toBeNull();
    expect(chromeApi.storage.onChanged.removeListener).toHaveBeenCalledTimes(1);
  });

  it('does not inject while paused but keeps the tile visible when its dialog is open', async () => {
    document.body.innerHTML = `<div ${ARCHIVED_FAB_ROW_ATTRIBUTE}>${startChatFabSurface}</div>`;
    installSpamBlockedFab({ documentRoot: document, chromeApi: createChromeApi(true) });
    await Promise.resolve();
    expect(document.querySelector(`[${SPAM_BLOCKED_FAB_ATTRIBUTE}]`)).toBeNull();

    resetSpamBlockedFabInstallationsForTests(document);
    document.body.innerHTML = `
      <div ${ARCHIVED_FAB_ROW_ATTRIBUTE}>${startChatFabSurface}</div>
      <mat-dialog-container><h2>Spam & blocked</h2></mat-dialog-container>
    `;
    installSpamBlockedFab({ documentRoot: document, chromeApi: createChromeApi() });
    await vi.waitFor(() => {
      expect(document.querySelector(`[${SPAM_BLOCKED_FAB_ATTRIBUTE}]`)).not.toBeNull();
    });
  });

  it('does not duplicate the installed FAB and refreshes only after local storage changes', async () => {
    document.body.innerHTML = `<div ${ARCHIVED_FAB_ROW_ATTRIBUTE}>${startChatFabSurface}</div>`;
    let localThis;
    const chromeApi = createChromeApi();
    chromeApi.storage.onChanged.addListener.mockImplementation((listener) => {
      localThis = listener;
    });

    const disconnect = installSpamBlockedFab({ documentRoot: document, chromeApi });
    const secondDisconnect = installSpamBlockedFab({ documentRoot: document, chromeApi });
    await vi.waitFor(() => {
      expect(document.querySelectorAll(`[${SPAM_BLOCKED_FAB_ATTRIBUTE}]`)).toHaveLength(1);
    });

    document.querySelector(`[${SPAM_BLOCKED_FAB_WRAP_ATTRIBUTE}]`).remove();
    localThis({}, 'sync');
    await Promise.resolve();
    expect(document.querySelector(`[${SPAM_BLOCKED_FAB_ATTRIBUTE}]`)).toBeNull();

    localThis({}, 'local');
    await vi.waitFor(() => {
      expect(document.querySelector(`[${SPAM_BLOCKED_FAB_ATTRIBUTE}]`)).not.toBeNull();
    });

    disconnect();
    secondDisconnect();
  });

  it('opens once, provides feedback, and keeps the tile visible after its dialog opens', async () => {
    document.body.innerHTML = `<div ${ARCHIVED_FAB_ROW_ATTRIBUTE}>${startChatFabSurface}</div>`;
    const localThis = vi.fn(async () => {
      document.body.insertAdjacentHTML(
        'beforeend',
        '<mat-dialog-container><h2>Spam & blocked</h2></mat-dialog-container>'
      );
      return { ok: true };
    });
    installSpamBlockedFab({
      documentRoot: document,
      chromeApi: createChromeApi(),
      openSpamBlocked: localThis
    });

    await vi.waitFor(() => {
      expect(document.querySelector(`[${SPAM_BLOCKED_FAB_ATTRIBUTE}]`)).not.toBeNull();
    });
    const fab = document.querySelector(`[${SPAM_BLOCKED_FAB_ATTRIBUTE}]`);
    fab.click();
    fab.click();

    await Promise.resolve();
    expect(document.querySelector(`[${SPAM_BLOCKED_FAB_ATTRIBUTE}]`)).not.toBeNull();
    expect(localThis).toHaveBeenCalledTimes(1);
    expect(document.querySelector('[data-messages-shortcuts-feedback-message]')?.textContent)
      .toBe('Spam & blocked opened.');
  });
});
