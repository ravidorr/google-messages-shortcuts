import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as composerAdapter from '../../src/content/adapters/composer-adapter.js';
import {
  assessComposerCapabilities,
  COMPOSER_CAPABILITY_IDS,
  COMPOSER_SELECTORS
} from '../../src/content/adapters/composer-adapter.js';
import { CAPABILITY_SUPPORTED, CAPABILITY_UNSAFE } from '../../src/content/adapters/capability-states.js';
import {
  closeCommandPalette,
  isCommandPaletteOpen,
  openCommandPalette
} from '../../src/content/command-palette.js';
import * as focusComposerAction from '../../src/content/focus-composer-action.js';
import { findComposerEditor, focusComposer } from '../../src/content/focus-composer-action.js';
import {
  installKeyboardController,
  resetKeyboardControllerInstallationsForTests
} from '../../src/content/keyboard-controller.js';
import { isEditableTarget } from '../../src/content/keyboard-context-guard.js';
import {
  findConversationLinksByIdentity,
  focusConversationLink,
  focusCursorByIdentity,
  focusListContainer,
  getConversationLinkIdentity,
  isUnreadConversationRow,
  moveToAdjacentRowIdentity,
  moveToAdjacentUnreadIdentity,
  openConversationLink,
  openCursorByIdentity,
  resolveCursorIdentity
} from '../../src/content/list-navigation.js';
import {
  getNavigationFeedbackMessage,
  showNavigationFeedback
} from '../../src/content/navigation-feedback.js';
import {
  consumePreviousConversationIdentity,
  recordOpenedConversation,
  resetNavigationHistoryForTests
} from '../../src/content/navigation-history.js';
import { getFocusableElements, restoreFocus, trapTabKey } from '../../src/content/overlay-focus-trap.js';
import {
  executePageNavigationCommand,
  focusCurrentCursor,
  resetPageNavigationStateForTests,
  setCurrentCursorIdentity,
  syncCursorFromDocument
} from '../../src/content/page-navigation-actions.js';
import {
  COMMAND_SOURCE_BROWSER,
  filterCommandRegistryEntries,
  getCommandRegistryEntries,
  getCommandRegistryEntry,
  resolveCommandAvailability
} from '../../src/content/page-command-registry.js';
import {
  isPageCommand,
  PAGE_COMMAND_ESCAPE_TO_LIST,
  PAGE_COMMAND_FOCUS_COMPOSER,
  PAGE_COMMAND_NEXT_CONVERSATION,
  PAGE_COMMAND_NEXT_UNREAD,
  PAGE_COMMAND_OPEN_CONVERSATION,
  PAGE_COMMAND_PREVIOUS_CONVERSATION,
  PAGE_COMMAND_PREVIOUS_UNREAD,
  PAGE_COMMAND_RETURN_PREVIOUS
} from '../../src/shared/page-commands.js';
import {
  closeShortcutHelpOverlay,
  openShortcutHelpOverlay
} from '../../src/content/shortcut-help-overlay.js';
import {
  composerEditorSurface,
  duplicateConversationLinkList,
  multiRowNavigationList
} from '../fixtures/dom/list-states.js';

function createChromeApi({ paused = false, labels = {} } = {}) {
  return {
    storage: {
      local: {
        get: vi.fn(async () => ({ extensionPaused: paused }))
      },
      onChanged: {
        addListener: vi.fn(),
        removeListener: vi.fn()
      }
    },
    runtime: {
      sendMessage: vi.fn(async () => labels)
    }
  };
}

describe('phase2 navigation coverage', () => {
  afterEach(() => {
    resetKeyboardControllerInstallationsForTests();
    resetPageNavigationStateForTests();
    resetNavigationHistoryForTests();
    closeCommandPalette();
    closeShortcutHelpOverlay();
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    document.body.innerHTML = multiRowNavigationList;
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  it('covers page command helpers and composer assessment branches', () => {
    expect(isPageCommand(PAGE_COMMAND_NEXT_CONVERSATION)).toBe(true);
    expect(isPageCommand('unknown')).toBe(false);
    expect(isEditableTarget(null)).toBe(false);

    const link = document.createElement('a');
    link.setAttribute('data-e2e-conversation', '');
    expect(getConversationLinkIdentity(link)).toBeNull();
    expect(getConversationLinkIdentity(document.createElement('span'))).toBeNull();

    document.body.innerHTML = `
      <textarea data-e2e-message-input></textarea>
      <textarea data-e2e-message-input></textarea>
    `;
    const localThis = assessComposerCapabilities(document, {
      editor: 'textarea[data-e2e-message-input]',
      sendButton: null
    });
    expect(localThis[COMPOSER_CAPABILITY_IDS.focus].state).toBe(CAPABILITY_UNSAFE);

    document.body.innerHTML = composerEditorSurface;
    expect(assessComposerCapabilities(document, COMPOSER_SELECTORS)[COMPOSER_CAPABILITY_IDS.focus].state)
      .toBe(CAPABILITY_SUPPORTED);
  });

  it('covers list navigation edge cases and cursor helpers', () => {
    expect(moveToAdjacentRowIdentity(document, null, 'next', {
      conversationRow: 'missing-row',
      conversationLink: 'a',
      unreadConversationMarker: '[data-e2e-is-unread="true"]'
    }).reason).toBe('no-rows');

    document.body.innerHTML = `
      <mws-conversation-list-item>
        <span>No link</span>
        <button aria-haspopup="menu"></button>
      </mws-conversation-list-item>
    `;
    expect(moveToAdjacentRowIdentity(document, null, 'next').reason).toBe('missing-link-identity');
    expect(focusListContainer(document, {
      conversationRow: 'mws-conversation-list-item',
      conversationLink: 'a[data-e2e-conversation]',
      unreadConversationMarker: '[data-e2e-is-unread="true"]'
    }).reason).toBe('list-not-found');

    document.body.innerHTML = multiRowNavigationList;
    expect(openCursorByIdentity(document, 'missing').reason).toBe('cursor-not-found');
    expect(openCursorByIdentity(document, 'href:/web/conversations/b').ok).toBe(true);
    expect(focusCursorByIdentity(document, 'href:/web/conversations/b').ok).toBe(true);

    document.body.innerHTML = duplicateConversationLinkList;
    expect(openCursorByIdentity(document, 'href:/web/conversations/shared').reason).toBe('cursor-ambiguous');
    expect(focusCursorByIdentity(document, 'href:/web/conversations/shared').reason).toBe('cursor-ambiguous');

    document.body.innerHTML = multiRowNavigationList;
    setCurrentCursorIdentity('href:/web/conversations/b');
    expect(syncCursorFromDocument(document)).toBe('href:/web/conversations/b');
    expect(focusCurrentCursor(document).ok).toBe(true);
    expect(focusCurrentCursor(document, {
      conversationRow: 'missing',
      selectedConversationLink: 'a',
      focusedConversationItem: 'mws-conversation-list-item[is-focused="true"]',
      conversationLink: 'a',
      unreadConversationMarker: '[x]'
    }).reason).toBe('cursor-not-found');

    document.body.innerHTML = '<mws-conversation-list-item><a href="/web/conversations/a"></a></mws-conversation-list-item>';
    expect(moveToAdjacentUnreadIdentity(document, null, 'next').reason).toBe('no-unread-loaded');
    expect(resolveCursorIdentity(document, 'stale')).toBe('href:/web/conversations/a');
  });

  it('executes remaining page navigation commands and history branches', async () => {
    const chromeApi = createChromeApi();

    await executePageNavigationCommand(PAGE_COMMAND_NEXT_UNREAD, document, chromeApi);
    await executePageNavigationCommand(PAGE_COMMAND_PREVIOUS_UNREAD, document, chromeApi);
    await executePageNavigationCommand(PAGE_COMMAND_ESCAPE_TO_LIST, document, chromeApi);
    await executePageNavigationCommand(PAGE_COMMAND_FOCUS_COMPOSER, document, chromeApi);
    await executePageNavigationCommand('unknown-command', document, chromeApi);

    document.body.innerHTML = '';
    await executePageNavigationCommand(PAGE_COMMAND_OPEN_CONVERSATION, document, chromeApi);
    await executePageNavigationCommand(PAGE_COMMAND_RETURN_PREVIOUS, document, chromeApi);

    document.body.innerHTML = multiRowNavigationList;
    recordOpenedConversation('href:/web/conversations/a');
    await executePageNavigationCommand(PAGE_COMMAND_OPEN_CONVERSATION, document, chromeApi);
    await executePageNavigationCommand(PAGE_COMMAND_RETURN_PREVIOUS, document, chromeApi);

    document.body.innerHTML = duplicateConversationLinkList;
    recordOpenedConversation('href:/web/conversations/shared');
    recordOpenedConversation('href:/web/conversations/shared');
    consumePreviousConversationIdentity();
    await executePageNavigationCommand(PAGE_COMMAND_RETURN_PREVIOUS, document, chromeApi);
  });

  it('maps navigation feedback for success and failure branches', () => {
    const commands = [
      PAGE_COMMAND_NEXT_CONVERSATION,
      PAGE_COMMAND_PREVIOUS_CONVERSATION,
      PAGE_COMMAND_OPEN_CONVERSATION,
      PAGE_COMMAND_RETURN_PREVIOUS,
      PAGE_COMMAND_NEXT_UNREAD,
      PAGE_COMMAND_PREVIOUS_UNREAD,
      PAGE_COMMAND_ESCAPE_TO_LIST,
      PAGE_COMMAND_FOCUS_COMPOSER,
      'custom-command'
    ];

    for (const command of commands) {
      expect(getNavigationFeedbackMessage({ ok: true, loadedUnreadCount: 1 }, command)?.message).toBeTruthy();
    }

    const reasons = [
      'extension-paused',
      'no-rows',
      'at-first-row',
      'at-last-row',
      'no-unread-loaded',
      'unread-boundary',
      'cursor-not-found',
      'cursor-ambiguous',
      'return-ambiguous',
      'return-not-found',
      'no-return-history',
      'composer-unavailable',
      'composer-not-found',
      'composer-ambiguous',
      'list-not-found',
      'missing-link-identity',
      'unexpected'
    ];

    for (const reason of reasons) {
      expect(getNavigationFeedbackMessage({ ok: false, reason, loadedUnreadCount: 2 }, PAGE_COMMAND_NEXT_UNREAD)?.message)
        .toBeTruthy();
    }

    showNavigationFeedback({ ok: false, reason: 'no-rows' }, PAGE_COMMAND_NEXT_CONVERSATION, document);
    const root = document.querySelector('[data-messages-shortcuts-navigation-feedback]');
    root.innerHTML = '';
    showNavigationFeedback({ ok: false, reason: 'no-rows' }, PAGE_COMMAND_NEXT_CONVERSATION, document);
  });

  it('covers remaining navigation and adapter branches', async () => {
    document.body.innerHTML = `
      <mws-conversation-list-item>
        <button aria-haspopup="menu"></button>
      </mws-conversation-list-item>
    `;
    expect(focusListContainer(document).reason).toBe('list-not-found');

    document.body.innerHTML = `
      <mws-conversation-list-item>
        <a data-e2e-is-unread="true"></a>
        <button aria-haspopup="menu"></button>
      </mws-conversation-list-item>
    `;
    expect(moveToAdjacentUnreadIdentity(document, null, 'next').reason).toBe('missing-link-identity');

    document.body.innerHTML = '';
    expect(assessComposerCapabilities(document, {
      editor: 'textarea[data-e2e-message-input]',
      sendButton: null
    })[COMPOSER_CAPABILITY_IDS.focus].state).not.toBe(CAPABILITY_SUPPORTED);

    for (let index = 0; index < 22; index += 1) {
      recordOpenedConversation(`href:/web/conversations/${index}`);
    }
    expect(consumePreviousConversationIdentity()).toBe('href:/web/conversations/20');

    document.body.innerHTML = composerEditorSurface;
    expect(getCommandRegistryEntry(PAGE_COMMAND_FOCUS_COMPOSER).availability.status).toBe('available');

    document.body.innerHTML = `
      <textarea aria-label="Message"></textarea>
      <textarea aria-label="Message"></textarea>
    `;
    expect(getCommandRegistryEntry(PAGE_COMMAND_FOCUS_COMPOSER).availability.status).toBe('unsafe');

    document.body.innerHTML = `
      <mws-message-input>
        <textarea aria-label="Message"></textarea>
        <div contenteditable="true" aria-label="Message"></div>
      </mws-message-input>
    `;
    expect(getCommandRegistryEntry(PAGE_COMMAND_FOCUS_COMPOSER).availability.status).toBe('available');

    document.body.innerHTML = `
      <textarea aria-label="Message"></textarea>
      <div contenteditable="true" aria-label="Message"></div>
    `;
    expect(getCommandRegistryEntry(PAGE_COMMAND_FOCUS_COMPOSER).availability.status).toBe('unsafe');

    expect(getCommandRegistryEntry('missing-command')).toBeNull();
    expect(filterCommandRegistryEntries(getCommandRegistryEntries(document), '   ').length)
      .toBeGreaterThan(10);
  });

  it('covers keyboard controller, overlays, and registry availability branches', async () => {
    const chromeApi = createChromeApi({
      labels: { 'archive-conversation': 'Ctrl+Shift+Y' }
    });
    const disconnect = installKeyboardController({ documentRoot: document, chromeApi });

    await vi.waitFor(() => {
      document.body.dispatchEvent(new KeyboardEvent('keydown', {
        code: 'KeyP',
        ctrlKey: true,
        shiftKey: true,
        isComposing: true,
        bubbles: true,
        cancelable: true
      }));

      expect(isCommandPaletteOpen()).toBe(false);
    });

    await vi.waitFor(() => {
      document.body.dispatchEvent(new KeyboardEvent('keydown', {
        code: 'Slash',
        shiftKey: true,
        bubbles: true,
        cancelable: true
      }));

      expect(document.querySelector('[data-messages-shortcuts-shortcut-help]')).not.toBeNull();
    });

    closeShortcutHelpOverlay(document);

    const pauseListener = chromeApi.storage.onChanged.addListener.mock.calls[0][0];
    pauseListener({ extensionPaused: { newValue: true } }, 'local');
    pauseListener({ extensionPaused: { newValue: true } }, 'sync');

    disconnect();
    installKeyboardController({ documentRoot: document, chromeApi });
    resetKeyboardControllerInstallationsForTests(document);

    await openCommandPalette(document, {
      runtime: { sendMessage: vi.fn(async () => { throw new Error('offline'); }) }
    });
    expect(isCommandPaletteOpen()).toBe(true);
    closeCommandPalette(document);

    await openCommandPalette(document, chromeApi);
    document.body.dispatchEvent(new KeyboardEvent('keydown', {
      code: 'ArrowDown',
      bubbles: true,
      cancelable: true
    }));
    document.body.dispatchEvent(new KeyboardEvent('keydown', {
      code: 'ArrowUp',
      bubbles: true,
      cancelable: true
    }));

    const paletteInput = document.querySelector('[data-messages-shortcuts-command-palette-input]');
    paletteInput.value = 'zzzz-no-match';
    paletteInput.dispatchEvent(new Event('input', { bubbles: true }));
    document.body.dispatchEvent(new KeyboardEvent('keydown', {
      code: 'ArrowDown',
      bubbles: true,
      cancelable: true
    }));

    await openCommandPalette(document, chromeApi);
    closeCommandPalette(document);
    closeCommandPalette(document);

    await openShortcutHelpOverlay(document, {
      runtime: { sendMessage: vi.fn(async () => { throw new Error('offline'); }) }
    });
    closeShortcutHelpOverlay(document);
    closeShortcutHelpOverlay(document);

    document.body.innerHTML = '<mat-dialog-container></mat-dialog-container>';
    document.body.dispatchEvent(new KeyboardEvent('keydown', {
      code: 'KeyP',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
      cancelable: true
    }));
    expect(isCommandPaletteOpen()).toBe(false);

    const browserEntry = getCommandRegistryEntries(document)
      .find((entry) => entry.source === COMMAND_SOURCE_BROWSER);
    expect(resolveCommandAvailability(browserEntry, document).status).toBe('browser-assigned');
    expect(findComposerEditor(document, COMPOSER_SELECTORS)).toBeNull();
    expect(findComposerEditor(document, { editor: 'textarea[data-e2e-message-input]' })).toBeNull();

    document.body.innerHTML = multiRowNavigationList;
    recordOpenedConversation('href:/web/conversations/a');
    await executePageNavigationCommand(PAGE_COMMAND_OPEN_CONVERSATION, document, chromeApi);
    document.body.innerHTML = duplicateConversationLinkList;
    await executePageNavigationCommand(PAGE_COMMAND_RETURN_PREVIOUS, document, chromeApi);
    document.body.innerHTML = multiRowNavigationList;
    recordOpenedConversation('href:/web/conversations/a');
    await executePageNavigationCommand(PAGE_COMMAND_OPEN_CONVERSATION, document, chromeApi);
    document.body.innerHTML = '';
    await executePageNavigationCommand(PAGE_COMMAND_RETURN_PREVIOUS, document, chromeApi);

    document.body.innerHTML = `
      <textarea data-e2e-message-input></textarea>
      <textarea data-e2e-message-input></textarea>
    `;
    expect(focusComposer(document, {
      editor: 'textarea[data-e2e-message-input]',
      sendButton: null
    }).reason).toBe('composer-ambiguous');

    document.body.innerHTML = '<textarea data-e2e-message-input></textarea>';
    const editor = document.querySelector('textarea');
    vi.spyOn(editor, 'focus').mockImplementation(() => {});
    expect(focusComposer(document, {
      editor: 'textarea[data-e2e-message-input]',
      sendButton: null
    }).reason).toBe('composer-not-found');
  });

  it('returns empty identity lookups for null input', () => {
    expect(findConversationLinksByIdentity(document, null)).toEqual([]);
    expect(isUnreadConversationRow(null)).toBe(false);
  });

  it('focuses an empty conversation list container when no rows are loaded', () => {
    document.body.innerHTML = '<mws-conversation-list></mws-conversation-list>';

    expect(focusListContainer(document).ok).toBe(true);
  });

  it('reports list-not-found when a row has no conversation link', () => {
    document.body.innerHTML = `
      <mws-conversation-list-item>
        <button aria-haspopup="menu"></button>
      </mws-conversation-list-item>
    `;

    expect(focusListContainer(document).reason).toBe('list-not-found');
  });

  it('reports cursor-not-found when no cursor identity is available', () => {
    resetPageNavigationStateForTests();
    document.body.innerHTML = '';

    expect(focusCurrentCursor(document).reason).toBe('cursor-not-found');
  });

  it('returns false when conversation links cannot be focused or opened', () => {
    expect(focusConversationLink(null)).toBe(false);
    expect(openConversationLink(null)).toBe(false);

    const link = document.createElement('a');
    link.href = '/web/conversations/a';
    Object.defineProperty(link, 'focus', { value: undefined });

    expect(focusConversationLink(link)).toBe(false);
  });

  it('focuses the conversation list root when rows exist without links', () => {
    document.body.innerHTML = '<mws-conversation-list tabindex="-1"></mws-conversation-list>';

    expect(focusListContainer(document).ok).toBe(true);
  });

  it('reports composer-not-found when capability assessment and editor lookup diverge', () => {
    vi.spyOn(composerAdapter, 'assessComposerCapabilities').mockReturnValue({
      [COMPOSER_CAPABILITY_IDS.focus]: { state: CAPABILITY_SUPPORTED, reason: 'mock' }
    });
    vi.spyOn(focusComposerAction, 'findComposerEditor').mockReturnValue(null);

    expect(focusComposer(document, {
      editor: 'textarea[data-e2e-message-input]',
      sendButton: null
    }).reason).toBe('composer-not-found');
  });

  it('ignores restoreFocus for disconnected or non-focusable elements', () => {
    restoreFocus(document.createElement('button'));
    restoreFocus({ isConnected: true, focus: undefined });
  });

  it('ignores keyboard shortcuts while paused even after the controller is installed', async () => {
    installKeyboardController({
      documentRoot: document,
      chromeApi: createChromeApi(),
      getPausedState: async () => true
    });

    document.body.dispatchEvent(new KeyboardEvent('keydown', {
      code: 'ArrowDown',
      altKey: true,
      bubbles: true,
      cancelable: true
    }));

    expect(document.querySelector('[data-messages-shortcuts-navigation-feedback-message]')).toBeNull();
  });

  it('blocks navigation shortcuts while the command palette is open', async () => {
    const activeChromeApi = createChromeApi();
    installKeyboardController({ documentRoot: document, chromeApi: activeChromeApi });
    await openCommandPalette(document, activeChromeApi);

    document.body.dispatchEvent(new KeyboardEvent('keydown', {
      code: 'ArrowDown',
      altKey: true,
      bubbles: true,
      cancelable: true
    }));

    expect(document.querySelector('[data-messages-shortcuts-navigation-feedback-message]')).toBeNull();
    closeCommandPalette(document);
  });

  it('returns ambiguous when duplicate loaded rows match the return target', async () => {
    recordOpenedConversation('href:/web/conversations/a');
    recordOpenedConversation('href:/web/conversations/b');
    document.body.innerHTML = `
      <mws-conversation-list-item>
        <a href="/web/conversations/a" data-e2e-conversation></a>
        <button aria-haspopup="menu"></button>
      </mws-conversation-list-item>
      <mws-conversation-list-item>
        <a href="/web/conversations/a" data-e2e-conversation></a>
        <button aria-haspopup="menu"></button>
      </mws-conversation-list-item>
    `;

    const localThis = await executePageNavigationCommand(
      PAGE_COMMAND_RETURN_PREVIOUS,
      document,
      createChromeApi()
    );

    expect(localThis.ok).toBe(false);
    expect(localThis.reason).toBe('return-ambiguous');
  });

  it('covers remaining branch-only paths', async () => {
    document.body.innerHTML = `
      <mws-conversation-list-item>
        <a aria-selected="true" href="/web/conversations/selected"></a>
        <button aria-haspopup="menu"></button>
      </mws-conversation-list-item>
    `;
    expect(resolveCursorIdentity(document, 'stale-identity')).toBe('href:/web/conversations/selected');

    document.body.innerHTML = `
      <mws-conversation-list-item>
        <a href="/web/conversations/first"></a>
        <button aria-haspopup="menu"></button>
      </mws-conversation-list-item>
    `;
    expect(resolveCursorIdentity(document, null)).toBe('href:/web/conversations/first');

    document.body.innerHTML = multiRowNavigationList;
    expect(moveToAdjacentUnreadIdentity(document, 'href:/web/conversations/c', 'previous').ok).toBe(true);

    await executePageNavigationCommand(PAGE_COMMAND_ESCAPE_TO_LIST, document, createChromeApi());

    document.body.innerHTML = multiRowNavigationList;
    setCurrentCursorIdentity('missing');
    await executePageNavigationCommand(PAGE_COMMAND_OPEN_CONVERSATION, document, createChromeApi());

    const chromeApi = createChromeApi();
    const disconnectFirst = installKeyboardController({ documentRoot: document, chromeApi });
    const disconnectSecond = installKeyboardController({ documentRoot: document, chromeApi });
    await openCommandPalette(document, chromeApi);
    for (const [listener] of chromeApi.storage.onChanged.addListener.mock.calls) {
      listener({ extensionPaused: { newValue: true } }, 'local');
    }
    expect(isCommandPaletteOpen()).toBe(false);
    disconnectSecond();
    disconnectFirst();

    await openCommandPalette(document, {
      runtime: { sendMessage: vi.fn(async () => null) }
    });
    closeCommandPalette(document);

    await openShortcutHelpOverlay(document, {
      runtime: { sendMessage: vi.fn(async () => null) }
    });
    closeShortcutHelpOverlay(document);

    expect(getNavigationFeedbackMessage(
      { ok: true, loadedUnreadCount: undefined },
      PAGE_COMMAND_PREVIOUS_UNREAD
    ).message).toContain('0 unread loaded');
    expect(getNavigationFeedbackMessage(
      { ok: false, reason: 'unread-boundary', loadedUnreadCount: undefined },
      PAGE_COMMAND_PREVIOUS_UNREAD
    ).message).toContain('first unread');

    document.body.innerHTML = `
      <mws-conversation-list-item is-focused="true">
        <a></a>
        <button aria-haspopup="menu"></button>
      </mws-conversation-list-item>
      <mws-conversation-list-item>
        <a aria-selected="true"></a>
        <button aria-haspopup="menu"></button>
      </mws-conversation-list-item>
    `;
    expect(resolveCursorIdentity(document, null)).toBeNull();

    document.body.innerHTML = multiRowNavigationList;
    expect(moveToAdjacentUnreadIdentity(document, null, 'next').ok).toBe(true);

    document.body.innerHTML = '<mws-conversation-list></mws-conversation-list>';
    await executePageNavigationCommand(PAGE_COMMAND_ESCAPE_TO_LIST, document, createChromeApi());

    document.body.innerHTML = multiRowNavigationList;
    recordOpenedConversation('href:/web/conversations/a');
    recordOpenedConversation('href:/web/conversations/b');
    document.body.innerHTML = '';
    await executePageNavigationCommand(PAGE_COMMAND_RETURN_PREVIOUS, document, createChromeApi());

    document.body.innerHTML = duplicateConversationLinkList;
    await executePageNavigationCommand(PAGE_COMMAND_OPEN_CONVERSATION, document, createChromeApi());

    const pauseChromeApi = createChromeApi();
    installKeyboardController({ documentRoot: document, chromeApi: pauseChromeApi });
    const pauseListener = pauseChromeApi.storage.onChanged.addListener.mock.calls.at(-1)[0];
    pauseListener({ extensionPaused: { newValue: false } }, 'local');
    closeCommandPalette(document);
    closeShortcutHelpOverlay(document);
  });

  it('covers overlay focus trap branches', () => {
    expect(getFocusableElements(null)).toEqual([]);
    expect(trapTabKey({ key: 'Enter' }, document.body)).toBe(false);

    document.body.innerHTML = '<div id="empty"></div>';
    const emptyPanel = document.getElementById('empty');
    const prevented = vi.fn();
    trapTabKey({ key: 'Tab', shiftKey: false, preventDefault: prevented }, emptyPanel);
    expect(prevented).toHaveBeenCalled();

    document.body.innerHTML = `
      <div id="panel">
        <button id="first">First</button>
        <button id="middle">Middle</button>
        <button id="last">Last</button>
      </div>
    `;
    const panel = document.getElementById('panel');
    panel.querySelector('#first').focus();
    trapTabKey({ key: 'Tab', shiftKey: true, preventDefault: vi.fn() }, panel);

    panel.querySelector('#middle').focus();
    expect(trapTabKey({ key: 'Tab', shiftKey: false, preventDefault: vi.fn() }, panel)).toBe(false);
  });
});
