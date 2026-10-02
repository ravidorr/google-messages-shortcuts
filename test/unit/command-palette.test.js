import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as pageKeymap from '../../src/shared/page-keymap.js';
import {
  closeCommandPalette,
  openCommandPalette,
  resetCommandPaletteForTests,
  simulateCommandPaletteOpenWithoutListenerForTests
} from '../../src/content/command-palette.js';

function createChromeApi() {
  return {
    runtime: {
      sendMessage: vi.fn(async () => ({
        'archive-conversation': 'Ctrl+Shift+Y'
      }))
    }
  };
}

describe('command-palette', () => {
  afterEach(() => {
    resetCommandPaletteForTests();
    document.body.innerHTML = '';
  });

  beforeEach(() => {
    document.body.innerHTML = multiRowNavigationList;
  });

  it('opens, filters, and closes the filterable command palette', async () => {
    await openCommandPalette(document, {
      runtime: { sendMessage: vi.fn(async () => ({})) }
    });

    const input = document.querySelector('[data-messages-shortcuts-command-palette-input]');
    const list = document.querySelector('[data-messages-shortcuts-command-palette-list]');

    expect(input).not.toBeNull();
    expect(list.children.length).toBeGreaterThan(0);

    input.value = 'next unread';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect(list.children.length).toBe(1);

    input.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true
    }));

    expect(document.querySelector('[data-messages-shortcuts-command-palette]')).toBeNull();
  });

  it('falls back to availability detail when page bindings are absent', async () => {
    vi.spyOn(pageKeymap, 'getPageKeyBindingsForCommand').mockReturnValue([]);
    await openCommandPalette(document, createChromeApi());

    const meta = document.querySelector('[data-messages-shortcuts-command-palette-meta]');
    expect(meta.textContent.length).toBeGreaterThan(0);
    closeCommandPalette(document);
  });

  it('supports keyboard navigation within the palette', async () => {
    await openCommandPalette(document, createChromeApi());

    const paletteItems = [...document.querySelectorAll('[data-messages-shortcuts-command-palette-item]')];
    for (const item of paletteItems) {
      item.scrollIntoView = vi.fn();
    }

    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      code: 'ArrowDown',
      bubbles: true,
      cancelable: true
    }));
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'ArrowUp',
      code: 'ArrowUp',
      bubbles: true,
      cancelable: true
    }));
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Tab',
      code: 'Tab',
      bubbles: true,
      cancelable: true
    }));

    delete paletteItems[1].scrollIntoView;
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      code: 'ArrowDown',
      bubbles: true,
      cancelable: true
    }));

    expect(paletteItems[1]?.scrollIntoView).toBeUndefined();

    const selectedItems = [
      ...document.querySelectorAll('[data-messages-shortcuts-command-palette-item][data-selected="true"]')
    ];

    expect(selectedItems.length).toBe(1);
    closeCommandPalette(document);
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

    const firstOpen = openCommandPalette(document, chromeApi);
    const secondOpen = openCommandPalette(document, chromeApi);

    expect(document.querySelectorAll('[data-messages-shortcuts-command-palette]').length).toBe(0);

    resolveLabels({});
    await Promise.all([firstOpen, secondOpen]);

    expect(document.querySelectorAll('[data-messages-shortcuts-command-palette]').length).toBe(1);
    closeCommandPalette(document);
  });

  it('closes safely when open without an attached keydown listener', () => {
    simulateCommandPaletteOpenWithoutListenerForTests();
    closeCommandPalette(document);
    expect(document.querySelector('[data-messages-shortcuts-command-palette]')).toBeNull();
  });
});

const multiRowNavigationList = `
  <mws-conversation-list-item>
    <a href="/web/conversations/a" data-e2e-conversation></a>
    <button aria-haspopup="menu"></button>
  </mws-conversation-list-item>
`;
