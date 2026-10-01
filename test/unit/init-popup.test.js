import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  bindConversationOpenPreference,
  bindTrashConfirmationPreference,
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
      <input id="auto-confirm-trash" type="checkbox" checked disabled>
      <label for="auto-confirm-trash">Automatically confirm Move to trash</label>
      <input id="open-conversation-on-focus" type="checkbox" disabled>
      <label for="open-conversation-on-focus">Open conversations on hover or focus</label>
    `;
  });

  it('shows a warning when shortcuts are missing', () => {
    updateShortcutWarning([
      { name: 'archive-conversation', shortcut: 'Ctrl+Shift+Y' },
      { name: 'trash-conversation', shortcut: '' }
    ]);

    expect(document.getElementById('shortcut-warning').hidden).toBe(false);
  });

  it('ignores the unassigned Chrome extension activation shortcut', () => {
    updateShortcutWarning([
      { name: '_execute_action', shortcut: '' },
      { name: 'archive-conversation', shortcut: 'Ctrl+Shift+Y' },
      { name: 'trash-conversation', shortcut: 'Ctrl+Shift+D' },
      { name: 'mark-read-conversation', shortcut: 'Ctrl+Shift+K' },
      { name: 'mark-unread-conversation', shortcut: 'Ctrl+Shift+U' }
    ]);

    expect(document.getElementById('shortcut-warning').hidden).toBe(true);
  });

  it('opens Chrome shortcut settings when the link is clicked', () => {
    const create = vi.fn(async () => ({}));
    const chromeApi = { tabs: { create } };

    bindShortcutsLink(document, chromeApi);

    document.getElementById('shortcuts-link').click();

    expect(create).toHaveBeenCalledWith({ url: 'chrome://extensions/shortcuts' });
  });

  it('loads a missing confirmation preference as checked', async () => {
    const chromeApi = {
      storage: {
        local: {
          get: vi.fn(async () => ({})),
          set: vi.fn(async () => {})
        }
      }
    };

    await bindTrashConfirmationPreference(document, chromeApi);

    expect(document.getElementById('auto-confirm-trash').checked).toBe(true);
  });

  it('keeps the confirmation preference disabled until it is loaded', async () => {
    let resolvePreference;
    const chromeApi = {
      storage: {
        local: {
          get: vi.fn(() => new Promise((resolve) => {
            resolvePreference = resolve;
          })),
          set: vi.fn(async () => {})
        }
      }
    };
    const checkbox = document.getElementById('auto-confirm-trash');

    const binding = bindTrashConfirmationPreference(document, chromeApi);

    expect(checkbox.disabled).toBe(true);
    resolvePreference({ autoConfirmTrash: false });
    await binding;

    expect(checkbox.disabled).toBe(false);
    expect(checkbox.checked).toBe(false);
  });

  it('loads a saved disabled confirmation preference', async () => {
    const chromeApi = {
      storage: {
        local: {
          get: vi.fn(async () => ({ autoConfirmTrash: false })),
          set: vi.fn(async () => {})
        }
      }
    };

    await bindTrashConfirmationPreference(document, chromeApi);

    expect(document.getElementById('auto-confirm-trash').checked).toBe(false);
  });

  it('persists a changed confirmation preference', async () => {
    const set = vi.fn(async () => {});
    const chromeApi = {
      storage: {
        local: {
          get: vi.fn(async () => ({ autoConfirmTrash: true })),
          set
        }
      }
    };

    await bindTrashConfirmationPreference(document, chromeApi);
    const checkbox = document.getElementById('auto-confirm-trash');
    checkbox.checked = false;
    checkbox.dispatchEvent(new Event('change'));
    await Promise.resolve();

    expect(set).toHaveBeenCalledWith({ autoConfirmTrash: false });
  });

  it('restores the saved preference when persistence fails', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const chromeApi = {
      storage: {
        local: {
          get: vi.fn(async () => ({ autoConfirmTrash: true })),
          set: vi.fn(async () => {
            throw new Error('storage unavailable');
          })
        }
      }
    };

    await bindTrashConfirmationPreference(document, chromeApi);
    const checkbox = document.getElementById('auto-confirm-trash');
    checkbox.checked = false;
    checkbox.dispatchEvent(new Event('change'));

    await vi.waitFor(() => {
      expect(warnSpy).toHaveBeenCalled();
    });

    expect(checkbox.checked).toBe(true);
    expect(checkbox.disabled).toBe(false);
  });

  it('loads and persists the conversation open preference', async () => {
    const set = vi.fn(async () => {});
    const chromeApi = {
      commands: {
        getAll: vi.fn(async () => [
          { name: 'archive-conversation', shortcut: 'Ctrl+Shift+Y' },
          { name: 'trash-conversation', shortcut: 'Ctrl+Shift+D' }
        ])
      },
      tabs: {
        create: vi.fn(async () => ({}))
      },
      storage: {
        local: {
          get: vi.fn(async () => ({ openConversationOnFocus: true })),
          set
        }
      }
    };

    await initializePopup(chromeApi, document);
    const checkbox = document.getElementById('open-conversation-on-focus');

    expect(checkbox.checked).toBe(true);
    expect(checkbox.disabled).toBe(false);
    checkbox.checked = false;
    checkbox.dispatchEvent(new Event('change'));
    await Promise.resolve();

    expect(set).toHaveBeenCalledWith({ openConversationOnFocus: false });
  });

  it('restores the conversation open preference when persistence fails', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const chromeApi = {
      storage: {
        local: {
          get: vi.fn(async () => ({ openConversationOnFocus: true })),
          set: vi.fn(async () => {
            throw new Error('storage unavailable');
          })
        }
      }
    };

    await bindConversationOpenPreference(document, chromeApi);
    const checkbox = document.getElementById('open-conversation-on-focus');
    checkbox.checked = false;
    checkbox.dispatchEvent(new Event('change'));

    await vi.waitFor(() => {
      expect(warnSpy).toHaveBeenCalled();
    });

    expect(checkbox.checked).toBe(true);
    expect(checkbox.disabled).toBe(false);
  });

  it('initializes the popup shortcut list', async () => {
    const chromeApi = {
      commands: {
        getAll: vi.fn(async () => [
          { name: 'archive-conversation', shortcut: 'Ctrl+Shift+Y' },
          { name: 'trash-conversation', shortcut: 'Ctrl+Shift+D' },
          { name: 'mark-read-conversation', shortcut: 'Ctrl+Shift+K' },
          { name: 'mark-unread-conversation', shortcut: 'Ctrl+Shift+U' }
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
      }
    };

    await initializePopup(chromeApi, document);

    expect(document.querySelectorAll('.shortcut-item')).toHaveLength(4);
    expect(document.getElementById('shortcut-warning').hidden).toBe(true);
    expect(document.getElementById('auto-confirm-trash').checked).toBe(true);
  });
});
