import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  isCommandPaletteOpen,
  openCommandPalette
} from '../../src/content/command-palette.js';
import {
  installKeyboardController,
  resetKeyboardControllerInstallationsForTests
} from '../../src/content/keyboard-controller.js';
import { recordOpenedConversation, resetNavigationHistoryForTests } from '../../src/content/navigation-history.js';
import { resetPageNavigationStateForTests } from '../../src/content/page-navigation-actions.js';
import {
  isShortcutHelpOpen,
  openShortcutHelpOverlay
} from '../../src/content/shortcut-help-overlay.js';
import {
  composerEditorSurface,
  multiRowNavigationList,
  openRowMenuMarkUnreadFallbackOnly
} from '../fixtures/dom/list-states.js';

function createChromeApi({ paused = false } = {}) {
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
      sendMessage: vi.fn(async () => ({}))
    }
  };
}

function dispatchKeydown({
  target = document.body,
  code,
  altKey = false,
  ctrlKey = false,
  metaKey = false,
  shiftKey = false
} = {}) {
  const event = new KeyboardEvent('keydown', {
    code,
    altKey,
    ctrlKey,
    metaKey,
    shiftKey,
    bubbles: true,
    cancelable: true
  });
  target.dispatchEvent(event);

  return event;
}

function dispatchAltArrowDown(target = document.body) {
  return dispatchKeydown({ target, code: 'ArrowDown', altKey: true });
}

async function installReadyController(chromeApi = createChromeApi()) {
  let pauseStateLoaded = false;
  const disconnect = installKeyboardController({
    documentRoot: document,
    chromeApi,
    getPausedState: async () => {
      pauseStateLoaded = true;

      return false;
    }
  });

  await vi.waitFor(() => {
    expect(pauseStateLoaded).toBe(true);
  });

  return disconnect;
}

describe('keyboard-controller', () => {
  let disconnect;

  afterEach(() => {
    disconnect?.();
    resetKeyboardControllerInstallationsForTests();
    resetNavigationHistoryForTests();
    resetPageNavigationStateForTests();
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    document.body.innerHTML = multiRowNavigationList;
  });

  it('installs a guarded keydown listener for page navigation commands', async () => {
    disconnect = installKeyboardController({
      documentRoot: document,
      chromeApi: createChromeApi()
    });

    await vi.waitFor(() => {
      dispatchAltArrowDown();

      expect(
        document.querySelector('[data-messages-shortcuts-navigation-feedback-message]')?.textContent
      ).toContain('Moved to another loaded conversation');
    });
  });

  it('ignores navigation when paused or the target is editable', async () => {
    disconnect = installKeyboardController({
      documentRoot: document,
      chromeApi: createChromeApi({ paused: true }),
      getPausedState: async () => true
    });

    await Promise.resolve();

    dispatchAltArrowDown();

    expect(document.querySelector('[data-messages-shortcuts-navigation-feedback-message]')).toBeNull();

    disconnect();
    disconnect = installKeyboardController({
      documentRoot: document,
      chromeApi: createChromeApi()
    });

    const input = document.createElement('input');
    document.body.append(input);
    dispatchAltArrowDown(input);

    expect(document.querySelector('[data-messages-shortcuts-navigation-feedback-message]')).toBeNull();
  });

  it('ignores navigation shortcuts while the command palette is open', async () => {
    disconnect = installKeyboardController({
      documentRoot: document,
      chromeApi: createChromeApi()
    });

    await vi.waitFor(() => {
      document.body.dispatchEvent(new KeyboardEvent('keydown', {
        code: 'KeyP',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
        cancelable: true
      }));

      expect(document.querySelector('[data-messages-shortcuts-command-palette]')).not.toBeNull();
    });

    dispatchAltArrowDown();

    expect(
      document.querySelector('[data-messages-shortcuts-navigation-feedback-message]')
    ).toBeNull();
  });

  it('ignores unrelated storage changes in the pause listener', async () => {
    const chromeApi = createChromeApi();

    disconnect = installKeyboardController({
      documentRoot: document,
      chromeApi
    });

    await openCommandPalette(document, chromeApi);
    const keyboardPauseListener = chromeApi.storage.onChanged.addListener.mock.calls[1][0];
    keyboardPauseListener({ otherSetting: { newValue: true } }, 'local');

    expect(isCommandPaletteOpen()).toBe(true);
  });

  it('skips initial list cursor setup while paused', async () => {
    vi.useFakeTimers();
    const establishInitialCursor = vi.fn(async () => null);

    disconnect = installKeyboardController({
      documentRoot: document,
      chromeApi: createChromeApi({ paused: true }),
      establishInitialCursor
    });

    await vi.waitFor(() => {
      expect(establishInitialCursor).not.toHaveBeenCalled();
    });

    await vi.advanceTimersByTimeAsync(4000);
    expect(establishInitialCursor).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('ignores unrelated keys once pause state is ready', async () => {
    const getPausedState = vi.fn(async () => false);

    disconnect = installKeyboardController({
      documentRoot: document,
      chromeApi: createChromeApi(),
      getPausedState
    });

    await vi.waitFor(() => {
      expect(getPausedState).toHaveBeenCalled();
    });

    document.body.dispatchEvent(new KeyboardEvent('keydown', {
      code: 'KeyZ',
      bubbles: true,
      cancelable: true
    }));

    expect(document.querySelector('[data-messages-shortcuts-navigation-feedback-message]')).toBeNull();
  });

  it('ignores matched navigation shortcuts in editable targets after pause state loads', async () => {
    const getPausedState = vi.fn(async () => false);

    disconnect = installKeyboardController({
      documentRoot: document,
      chromeApi: createChromeApi(),
      getPausedState
    });

    const input = document.createElement('input');
    document.body.append(input);

    await vi.waitFor(() => {
      expect(getPausedState).toHaveBeenCalled();
    });

    dispatchAltArrowDown(input);

    expect(document.querySelector('[data-messages-shortcuts-navigation-feedback-message]')).toBeNull();
  });

  it('does not intercept shortcuts until the pause preference has loaded', async () => {
    let resolvePausedState;
    const getPausedState = vi.fn(async () => new Promise((resolve) => {
      resolvePausedState = resolve;
    }));

    disconnect = installKeyboardController({
      documentRoot: document,
      chromeApi: createChromeApi({ paused: true }),
      getPausedState
    });

    const blockedEvent = new KeyboardEvent('keydown', {
      code: 'ArrowDown',
      altKey: true,
      bubbles: true,
      cancelable: true
    });

    document.body.dispatchEvent(blockedEvent);

    expect(blockedEvent.defaultPrevented).toBe(false);
    expect(document.querySelector('[data-messages-shortcuts-navigation-feedback-message]')).toBeNull();

    resolvePausedState(true);
    await vi.waitFor(() => {
      expect(getPausedState).toHaveBeenCalled();
    });

    const pausedEvent = new KeyboardEvent('keydown', {
      code: 'ArrowDown',
      altKey: true,
      bubbles: true,
      cancelable: true
    });

    document.body.dispatchEvent(pausedEvent);

    expect(pausedEvent.defaultPrevented).toBe(false);
    expect(document.querySelector('[data-messages-shortcuts-navigation-feedback-message]')).toBeNull();
  });

  it('prevents default synchronously once pause state is loaded', async () => {
    disconnect = installKeyboardController({
      documentRoot: document,
      chromeApi: createChromeApi()
    });

    await vi.waitFor(() => {
      const event = new KeyboardEvent('keydown', {
        code: 'ArrowDown',
        altKey: true,
        bubbles: true,
        cancelable: true
      });

      document.body.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
    });
  });

  it('ignores palette and help shortcuts while the target is editable', async () => {
    disconnect = installKeyboardController({
      documentRoot: document,
      chromeApi: createChromeApi()
    });

    const composerHost = document.createElement('mws-message-input');
    const textarea = document.createElement('textarea');
    textarea.setAttribute('aria-label', 'Message');
    composerHost.append(textarea);
    document.body.append(composerHost);
    textarea.focus();

    composerHost.dispatchEvent(new KeyboardEvent('keydown', {
      code: 'KeyP',
      metaKey: true,
      shiftKey: true,
      bubbles: true,
      cancelable: true
    }));
    composerHost.dispatchEvent(new KeyboardEvent('keydown', {
      code: 'Slash',
      shiftKey: true,
      bubbles: true,
      cancelable: true
    }));

    await Promise.resolve();

    expect(document.querySelector('[data-messages-shortcuts-command-palette]')).toBeNull();
    expect(document.querySelector('[data-messages-shortcuts-shortcut-help]')).toBeNull();
  });

  it('opens the command palette with the configured shortcut', async () => {
    disconnect = installKeyboardController({
      documentRoot: document,
      chromeApi: createChromeApi()
    });

    await vi.waitFor(() => {
      dispatchKeydown({ code: 'KeyP', ctrlKey: true, shiftKey: true });

      expect(document.querySelector('[data-messages-shortcuts-command-palette]')).not.toBeNull();
    });
  });

  it('moves to the previous conversation with Alt+ArrowUp', async () => {
    disconnect = await installReadyController();

    await vi.waitFor(() => {
      dispatchKeydown({ code: 'ArrowUp', altKey: true });

      expect(document.activeElement.getAttribute('href')).toBe('/web/conversations/a');
      expect(document.querySelector('[data-messages-shortcuts-list-cursor="true"]')).not.toBeNull();
    });
  });

  it('opens the focused conversation with Alt+Enter', async () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    disconnect = await installReadyController();

    await vi.waitFor(() => {
      dispatchKeydown({ code: 'Enter', altKey: true });

      expect(clickSpy).toHaveBeenCalled();
    });
  });

  it('returns to the previous conversation with Alt+[', async () => {
    recordOpenedConversation('href:/web/conversations/a');
    recordOpenedConversation('href:/web/conversations/b');
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    disconnect = await installReadyController();

    await vi.waitFor(() => {
      dispatchKeydown({ code: 'BracketLeft', altKey: true });

      expect(clickSpy).toHaveBeenCalled();
    });
  });

  it('moves to the next unread conversation with Alt+U', async () => {
    disconnect = await installReadyController();

    await vi.waitFor(() => {
      dispatchKeydown({ code: 'KeyU', altKey: true });

      expect(document.activeElement.getAttribute('href')).toBe('/web/conversations/c');
    });
  });

  it('moves to the previous unread conversation with Alt+Shift+U', async () => {
    disconnect = await installReadyController();

    await vi.waitFor(() => {
      dispatchKeydown({ code: 'KeyU', altKey: true });

      expect(document.activeElement.getAttribute('href')).toBe('/web/conversations/c');
    });

    await vi.waitFor(() => {
      dispatchKeydown({ code: 'KeyU', altKey: true, shiftKey: true });

      expect(document.activeElement.getAttribute('href')).toBe('/web/conversations/b');
    });
  });

  it('returns focus to the conversation list with Escape', async () => {
    disconnect = await installReadyController();

    await vi.waitFor(() => {
      dispatchKeydown({ code: 'Escape' });

      expect(
        document.querySelector('[data-messages-shortcuts-navigation-feedback-message]')?.textContent
      ).toContain('Focused the conversation list');
    });
  });

  it('focuses the composer with Alt+M when a composer is visible', async () => {
    document.body.insertAdjacentHTML('beforeend', composerEditorSurface);
    disconnect = await installReadyController();

    await vi.waitFor(() => {
      dispatchKeydown({ code: 'KeyM', altKey: true });

      expect(
        document.querySelector('[data-messages-shortcuts-navigation-feedback-message]')?.textContent
      ).toContain('Focused the message composer');
      expect(document.activeElement.matches('textarea[aria-label="Message"]')).toBe(true);
    });
  });

  it('opens the shortcut help overlay with Shift+/', async () => {
    disconnect = await installReadyController();

    dispatchKeydown({ code: 'Slash', shiftKey: true });

    await vi.waitFor(() => {
      expect(document.querySelector('[data-messages-shortcuts-shortcut-help]')).not.toBeNull();
    });
  });

  it('ignores navigation when text is selected', async () => {
    document.body.innerHTML = `
      <p id="fixture-selection">Selected navigation text</p>
      ${multiRowNavigationList}
    `;
    const paragraph = document.getElementById('fixture-selection');
    const range = document.createRange();
    range.selectNodeContents(paragraph);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    disconnect = await installReadyController();
    dispatchAltArrowDown();

    expect(document.querySelector('[data-messages-shortcuts-navigation-feedback-message]')).toBeNull();
    selection.removeAllRanges();
  });

  it('ignores navigation shortcuts while the shortcut help overlay is open', async () => {
    disconnect = await installReadyController();
    await openShortcutHelpOverlay(document, createChromeApi());

    expect(isShortcutHelpOpen()).toBe(true);

    dispatchAltArrowDown();

    expect(document.querySelector('[data-messages-shortcuts-navigation-feedback-message]')).toBeNull();
  });

  it('ignores Escape navigation while a row menu is open', async () => {
    document.body.innerHTML = `${multiRowNavigationList}${openRowMenuMarkUnreadFallbackOnly}`;
    disconnect = await installReadyController();

    dispatchKeydown({ code: 'Escape' });

    expect(document.querySelector('[data-messages-shortcuts-navigation-feedback-message]')).toBeNull();
    expect(document.querySelector('.conversation-actions-menu')).not.toBeNull();
  });
});
