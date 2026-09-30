import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  bindShortcutsLink,
  initializePopup,
  updateShortcutWarning
} from '../../src/popup/init-popup.js';

describe('init-popup', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <ul id="shortcut-list"></ul>
      <p id="shortcut-warning" hidden></p>
      <a id="shortcuts-link" href="#">shortcuts</a>
    `;
  });

  it('shows a warning when shortcuts are missing', () => {
    updateShortcutWarning([
      { name: 'archive-conversation', shortcut: 'Ctrl+Shift+Y' },
      { name: 'trash-conversation', shortcut: '' }
    ]);

    expect(document.getElementById('shortcut-warning').hidden).toBe(false);
  });

  it('opens Chrome shortcut settings when the link is clicked', () => {
    const create = vi.fn(async () => ({}));
    const chromeApi = { tabs: { create } };

    bindShortcutsLink(document, chromeApi);

    document.getElementById('shortcuts-link').click();

    expect(create).toHaveBeenCalledWith({ url: 'chrome://extensions/shortcuts' });
  });

  it('initializes the popup shortcut list', async () => {
    const chromeApi = {
      commands: {
        getAll: vi.fn(async () => [
          { name: 'archive-conversation', shortcut: 'Ctrl+Shift+Y' },
          { name: 'trash-conversation', shortcut: 'Ctrl+Shift+D' }
        ])
      },
      tabs: {
        create: vi.fn(async () => ({}))
      }
    };

    await initializePopup(chromeApi, document);

    expect(document.querySelectorAll('.shortcut-item')).toHaveLength(2);
    expect(document.getElementById('shortcut-warning').hidden).toBe(true);
  });
});
