import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('popup entry', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <ul id="shortcut-list"></ul>
      <p id="shortcut-warning" hidden></p>
      <a id="shortcuts-link" href="#">shortcuts</a>
    `;

    globalThis.chrome = {
      commands: {
        getAll: vi.fn(async () => [
          { name: 'archive-conversation', shortcut: 'Ctrl+Shift+Y' },
          { name: 'trash-conversation', shortcut: '' }
        ])
      },
      tabs: {
        create: vi.fn(async () => ({}))
      }
    };
  });

  it('loads shortcut data into the popup', async () => {
    vi.resetModules();
    await import('../../popup.js');
    await Promise.resolve();
    await Promise.resolve();

    expect(document.querySelectorAll('.shortcut-item')).toHaveLength(2);
    expect(document.getElementById('shortcut-warning').hidden).toBe(false);
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
      }
    };

    document.body.innerHTML = `
      <ul id="shortcut-list"></ul>
      <p id="shortcut-warning" hidden></p>
      <a id="shortcuts-link" href="#">shortcuts</a>
    `;

    await import('../../popup.js');
    await Promise.resolve();
    await Promise.resolve();

    expect(warnSpy).toHaveBeenCalled();
  });
});
