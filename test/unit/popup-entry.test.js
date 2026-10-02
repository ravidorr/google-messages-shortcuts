import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadPopupMarkup } from '../helpers/load-popup-markup.js';

function createChromeApi(overrides = {}) {
  return {
    commands: {
      getAll: vi.fn(async () => [
        { name: 'archive-conversation', shortcut: 'Ctrl+Shift+Y' },
        { name: 'trash-conversation', shortcut: '' },
        { name: 'mark-read-conversation', shortcut: '' },
        { name: 'mark-unread-conversation', shortcut: '' }
      ])
    },
    tabs: {
      create: vi.fn(async () => ({}))
    },
    storage: {
      local: {
        get: vi.fn(async () => ({})),
        set: vi.fn(async () => {})
      }
    },
    runtime: {
      getManifest: vi.fn(() => ({ version: '1.8.0' }))
    },
    ...overrides
  };
}

describe('popup entry', () => {
  afterEach(() => {
    vi.resetModules();
  });

  beforeEach(async () => {
    await loadPopupMarkup();
    globalThis.chrome = createChromeApi();
  });

  it('loads shortcut data into the shipped popup markup', async () => {
    await import('../../popup.js');
    await Promise.resolve();
    await Promise.resolve();

    expect(document.querySelectorAll('.shortcut-item')).toHaveLength(8);
    expect(document.getElementById('shortcut-warning').hidden).toBe(false);
    expect(document.getElementById('auto-confirm-trash').checked).toBe(true);
    expect(document.getElementById('auto-confirm-trash').disabled).toBe(false);
    expect(document.getElementById('open-conversation-on-focus').disabled).toBe(false);
    expect(document.getElementById('extension-version').textContent).toBe('Version 1.8.0');
  });

  it('opens Chrome shortcut settings from the shipped popup link', async () => {
    await import('../../popup.js');
    await Promise.resolve();
    await Promise.resolve();

    document.getElementById('shortcuts-link').click();

    expect(globalThis.chrome.tabs.create).toHaveBeenCalledWith({
      url: 'chrome://extensions/shortcuts'
    });
  });

  it('logs popup initialization failures', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    vi.resetModules();
    await loadPopupMarkup();
    globalThis.chrome = createChromeApi({
      commands: {
        getAll: vi.fn(async () => {
          throw new Error('commands unavailable');
        })
      }
    });

    await import('../../popup.js');
    await Promise.resolve();
    await Promise.resolve();

    expect(warnSpy).toHaveBeenCalled();
  });
});
