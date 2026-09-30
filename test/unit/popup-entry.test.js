import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('popup entry', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <ul id="shortcut-list"></ul>
      <p id="shortcut-warning" hidden></p>
      <a id="shortcuts-link" href="#">shortcuts</a>
      <input id="auto-confirm-trash" type="checkbox">
      <label for="auto-confirm-trash">Automatically confirm Move to trash</label>
      <input id="open-conversation-on-focus" type="checkbox" disabled>
      <label for="open-conversation-on-focus">Open conversations on hover or focus</label>
    `;

    globalThis.chrome = {
      commands: {
        getAll: vi.fn(async () => [
          { name: 'archive-conversation', shortcut: 'Ctrl+Shift+Y' },
          { name: 'trash-conversation', shortcut: '' },
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
      }
    };
  });

  it('loads shortcut data into the popup', async () => {
    vi.resetModules();
    await import('../../popup.js');
    await Promise.resolve();
    await Promise.resolve();

    expect(document.querySelectorAll('.shortcut-item')).toHaveLength(3);
    expect(document.getElementById('shortcut-warning').hidden).toBe(false);
    expect(document.getElementById('auto-confirm-trash').checked).toBe(true);
  });

  it('logs popup initialization failures', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    vi.resetModules();
    globalThis.chrome = {
      commands: {
        getAll: vi.fn(async () => {
          throw new Error('commands unavailable');
        })
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

    document.body.innerHTML = `
      <ul id="shortcut-list"></ul>
      <p id="shortcut-warning" hidden></p>
      <a id="shortcuts-link" href="#">shortcuts</a>
      <input id="auto-confirm-trash" type="checkbox">
      <label for="auto-confirm-trash">Automatically confirm Move to trash</label>
      <input id="open-conversation-on-focus" type="checkbox" disabled>
      <label for="open-conversation-on-focus">Open conversations on hover or focus</label>
    `;

    await import('../../popup.js');
    await Promise.resolve();
    await Promise.resolve();

    expect(warnSpy).toHaveBeenCalled();
  });
});
