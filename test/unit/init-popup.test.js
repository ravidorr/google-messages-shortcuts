import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  bindConversationOpenPreference,
  bindPillVisibilityPreference,
  bindPausePreference,
  bindResetExtensionPreferences,
  bindTrashConfirmationPreference,
  bindShortcutsLink,
  initializePopup,
  updateShortcutWarning
} from '../../src/popup/init-popup.js';
import { DEFAULT_EXTENSION_PREFERENCES } from '../../src/shared/reset-extension-preferences.js';

describe('init-popup', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <ul id="shortcut-list"></ul>
      <ul id="navigation-shortcut-list"></ul>
      <p id="extension-version" class="popup__version" hidden></p>
      <p id="shortcut-warning" hidden></p>
      <a id="shortcuts-link" href="#">shortcuts</a>
      <input id="auto-confirm-trash" type="checkbox" checked disabled>
      <label for="auto-confirm-trash">Automatically confirm Move to trash</label>
      <input id="open-conversation-on-focus" type="checkbox" disabled>
      <label for="open-conversation-on-focus">Open conversations on hover or focus</label>
      <label for="pill-visibility">Show shortcut pills</label>
      <select id="pill-visibility" disabled>
        <option value="hover-or-focus">On hover or focus</option>
        <option value="selected-row-only">On selected row only</option>
        <option value="hidden">Hidden</option>
      </select>
      <input id="pause-extension" type="checkbox" disabled>
      <label for="pause-extension">Pause shortcut actions and pills</label>
      <button id="reset-extension-preferences" type="button" disabled>Reset extension preferences</button>
      <p id="reset-status" hidden></p>
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

  it('restores the pause preference when persistence fails', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const chromeApi = {
      storage: {
        local: {
          get: vi.fn(async () => ({ extensionPaused: false })),
          set: vi.fn(async () => {
            throw new Error('storage unavailable');
          })
        }
      }
    };

    await bindPausePreference(document, chromeApi);
    const checkbox = document.getElementById('pause-extension');
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));

    await vi.waitFor(() => {
      expect(warnSpy).toHaveBeenCalled();
    });

    expect(checkbox.checked).toBe(false);
    expect(checkbox.disabled).toBe(false);
  });

  it('reports reset failures without changing Google Messages', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const chromeApi = {
      storage: {
        local: {
          set: vi.fn(async () => {
            throw new Error('storage unavailable');
          })
        }
      }
    };

    await bindResetExtensionPreferences(document, chromeApi);
    document.getElementById('reset-extension-preferences').click();

    await vi.waitFor(() => {
      expect(document.getElementById('reset-status').hidden).toBe(false);
    });

    expect(document.getElementById('reset-status').textContent)
      .toContain('Could not reset extension preferences');
    expect(warnSpy).toHaveBeenCalled();
  });

  it('loads and persists the pause preference', async () => {
    const set = vi.fn(async () => {});
    const chromeApi = {
      storage: {
        local: {
          get: vi.fn(async () => ({ extensionPaused: true })),
          set
        }
      }
    };

    await bindPausePreference(document, chromeApi);
    const checkbox = document.getElementById('pause-extension');

    expect(checkbox.checked).toBe(true);
    expect(checkbox.disabled).toBe(false);
    checkbox.checked = false;
    checkbox.dispatchEvent(new Event('change'));
    await Promise.resolve();

    expect(set).toHaveBeenCalledWith({ extensionPaused: false });
  });

  it('loads and persists the pill visibility preference', async () => {
    const set = vi.fn(async () => {});
    const chromeApi = {
      storage: {
        local: {
          get: vi.fn(async () => ({ pillVisibility: 'selected-row-only' })),
          set
        }
      }
    };

    await bindPillVisibilityPreference(document, chromeApi);
    const select = document.getElementById('pill-visibility');

    expect(select.value).toBe('selected-row-only');
    expect(select.disabled).toBe(false);
    select.value = 'hidden';
    select.dispatchEvent(new Event('change'));
    await Promise.resolve();

    expect(set).toHaveBeenCalledWith({ pillVisibility: 'hidden' });
  });

  it('restores the pill visibility preference when persistence fails', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const chromeApi = {
      storage: {
        local: {
          get: vi.fn(async () => ({ pillVisibility: 'hover-or-focus' })),
          set: vi.fn(async () => {
            throw new Error('storage unavailable');
          })
        }
      }
    };

    await bindPillVisibilityPreference(document, chromeApi);
    const select = document.getElementById('pill-visibility');
    select.value = 'hidden';
    select.dispatchEvent(new Event('change'));

    await vi.waitFor(() => {
      expect(warnSpy).toHaveBeenCalled();
    });

    expect(select.value).toBe('hover-or-focus');
    expect(select.disabled).toBe(false);
  });

  it('keeps pill visibility rollback aligned with reset defaults', async () => {
    const set = vi.fn(async () => {});
    const chromeApi = {
      storage: {
        local: {
          get: vi.fn(async () => ({ pillVisibility: 'hidden' })),
          set
        }
      }
    };

    const syncPillVisibilityPreference = await bindPillVisibilityPreference(document, chromeApi);
    await bindResetExtensionPreferences(document, chromeApi, {
      syncPillVisibilityPreference
    });

    document.getElementById('reset-extension-preferences').click();

    await vi.waitFor(() => {
      expect(document.getElementById('pill-visibility').value).toBe('hover-or-focus');
    });

    set.mockRejectedValueOnce(new Error('storage unavailable'));
    const select = document.getElementById('pill-visibility');
    select.value = 'selected-row-only';
    select.dispatchEvent(new Event('change'));

    await vi.waitFor(() => {
      expect(select.value).toBe('hover-or-focus');
    });
  });

  it('resets extension preferences without touching Google Messages data', async () => {
    const set = vi.fn(async () => {});
    const chromeApi = {
      storage: {
        local: { set }
      }
    };

    await bindResetExtensionPreferences(document, chromeApi);
    document.getElementById('auto-confirm-trash').checked = false;
    document.getElementById('open-conversation-on-focus').checked = true;
    document.getElementById('pill-visibility').value = 'hidden';
    document.getElementById('pause-extension').checked = true;

    document.getElementById('reset-extension-preferences').click();

    await vi.waitFor(() => {
      expect(document.getElementById('auto-confirm-trash').checked).toBe(true);
    });

    expect(set).toHaveBeenCalledWith(DEFAULT_EXTENSION_PREFERENCES);
    expect(document.getElementById('auto-confirm-trash').checked).toBe(true);
    expect(document.getElementById('open-conversation-on-focus').checked).toBe(false);
    expect(document.getElementById('pill-visibility').value).toBe('hover-or-focus');
    expect(document.getElementById('pause-extension').checked).toBe(false);
    expect(document.getElementById('reset-status').hidden).toBe(false);
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
      runtime: {
        getManifest: vi.fn(() => ({ version: '1.8.0' }))
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

    expect(document.getElementById('extension-version').textContent).toBe('Version 1.8.0');
    expect(document.querySelectorAll('.shortcut-item')).toHaveLength(9);
    expect(document.getElementById('navigation-shortcut-list').querySelectorAll('.shortcut-item'))
      .toHaveLength(2);
    expect(document.getElementById('shortcut-warning').hidden).toBe(true);
    expect(document.getElementById('auto-confirm-trash').checked).toBe(true);
  });
});
