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
      document.body.dispatchEvent(new KeyboardEvent('keydown', {
        code: 'KeyP',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
        cancelable: true
      }));

      expect(document.querySelector('[data-messages-shortcuts-command-palette]')).not.toBeNull();
    });
  });
});
