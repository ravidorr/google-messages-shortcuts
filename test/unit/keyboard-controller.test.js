import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  isCommandPaletteOpen,
  openCommandPalette
} from '../../src/content/command-palette.js';
import {
  installKeyboardController,
  resetKeyboardControllerInstallationsForTests
} from '../../src/content/keyboard-controller.js';
import { multiRowNavigationList } from '../fixtures/dom/list-states.js';

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

function dispatchAltArrowDown(target = document.body) {
  target.dispatchEvent(new KeyboardEvent('keydown', {
    code: 'ArrowDown',
    altKey: true,
    bubbles: true,
    cancelable: true
  }));
}

describe('keyboard-controller', () => {
  let disconnect;

  afterEach(() => {
    disconnect?.();
    resetKeyboardControllerInstallationsForTests();
    document.body.innerHTML = '';
  });

  beforeEach(() => {
    document.body.innerHTML = multiRowNavigationList;
  });

  it('installs a guarded keydown listener for page navigation commands', async () => {
    disconnect = installKeyboardController({
      documentRoot: document,
      chromeApi: createChromeApi()
    });

    dispatchAltArrowDown();

    await vi.waitFor(() => {
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

    await Promise.resolve();

    document.body.dispatchEvent(new KeyboardEvent('keydown', {
      code: 'KeyP',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
      cancelable: true
    }));

    await vi.waitFor(() => {
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
      ctrlKey: true,
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

  it('ignores palette and help shortcuts while a textarea composer is focused', async () => {
    disconnect = installKeyboardController({
      documentRoot: document,
      chromeApi: createChromeApi()
    });

    const textarea = document.createElement('textarea');
    textarea.setAttribute('aria-label', 'Message');
    document.body.append(textarea);
    textarea.focus();

    textarea.dispatchEvent(new KeyboardEvent('keydown', {
      code: 'KeyP',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
      cancelable: true
    }));
    textarea.dispatchEvent(new KeyboardEvent('keydown', {
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

    await Promise.resolve();

    document.body.dispatchEvent(new KeyboardEvent('keydown', {
      code: 'KeyP',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
      cancelable: true
    }));

    await vi.waitFor(() => {
      expect(document.querySelector('[data-messages-shortcuts-command-palette]')).not.toBeNull();
    });
  });
});
