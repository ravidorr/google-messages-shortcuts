import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as pageKeymap from '../../src/shared/page-keymap.js';
import {
  closeShortcutHelpOverlay,
  openShortcutHelpOverlay,
  resetShortcutHelpForTests,
  simulateShortcutHelpOpenWithoutListenerForTests
} from '../../src/content/shortcut-help-overlay.js';

function createChromeApi() {
  return {
    runtime: {
      sendMessage: vi.fn(async () => ({
        'archive-conversation': 'Ctrl+Shift+Y'
      }))
    }
  };
}

describe('shortcut-help-overlay', () => {
  afterEach(() => {
    resetShortcutHelpForTests();
    document.body.innerHTML = '';
  });

  beforeEach(() => {
    document.body.innerHTML = '<mws-conversation-list-item><a href="/web/conversations/a"></a></mws-conversation-list-item>';
  });

  it('safely closes when the overlay is not open', () => {
    closeShortcutHelpOverlay(document);
    expect(document.querySelector('[data-messages-shortcuts-shortcut-help]')).toBeNull();
  });

  it('shows page-local fallback text when page bindings are absent', async () => {
    vi.spyOn(pageKeymap, 'getPageKeyBindingsForCommand').mockReturnValue([]);
    await openShortcutHelpOverlay(document, createChromeApi());

    const binding = document.querySelector('[data-messages-shortcuts-shortcut-help-binding]');
    expect(binding.textContent).toBe('Page-local');
    closeShortcutHelpOverlay(document);
  });

  it('opens and closes the shortcut reference overlay', async () => {
    await openShortcutHelpOverlay(document, createChromeApi());
    await openShortcutHelpOverlay(document, createChromeApi());

    expect(document.querySelector('[data-messages-shortcuts-shortcut-help]')).not.toBeNull();
    expect(document.querySelector('[data-messages-shortcuts-shortcut-help-item]')).not.toBeNull();

    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Tab',
      code: 'Tab',
      bubbles: true,
      cancelable: true
    }));

    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true
    }));

    expect(document.querySelector('[data-messages-shortcuts-shortcut-help]')).toBeNull();
    closeShortcutHelpOverlay(document);
  });

  it('cancels help overlay mounting when closed before browser labels finish loading', async () => {
    let resolveLabels;
    const chromeApi = {
      runtime: {
        sendMessage: vi.fn(() => new Promise((resolve) => {
          resolveLabels = resolve;
        }))
      }
    };

    const open = openShortcutHelpOverlay(document, chromeApi);
    closeShortcutHelpOverlay(document);
    resolveLabels({});
    await open;

    expect(document.querySelector('[data-messages-shortcuts-shortcut-help]')).toBeNull();
  });

  it('serializes concurrent open calls while browser labels are loading', async () => {
    let resolveLabels;
    const chromeApi = {
      runtime: {
        sendMessage: vi.fn(() => new Promise((resolve) => {
          resolveLabels = resolve;
        }))
      }
    };

    const firstOpen = openShortcutHelpOverlay(document, chromeApi);
    const secondOpen = openShortcutHelpOverlay(document, chromeApi);

    expect(document.querySelectorAll('[data-messages-shortcuts-shortcut-help]').length).toBe(0);

    resolveLabels({});
    await Promise.all([firstOpen, secondOpen]);

    expect(document.querySelectorAll('[data-messages-shortcuts-shortcut-help]').length).toBe(1);
    closeShortcutHelpOverlay(document);
  });

  it('closes safely when open without an attached keydown listener', () => {
    simulateShortcutHelpOpenWithoutListenerForTests();
    closeShortcutHelpOverlay(document);
    expect(document.querySelector('[data-messages-shortcuts-shortcut-help]')).toBeNull();
  });
});
