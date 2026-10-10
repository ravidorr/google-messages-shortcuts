import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadPopupMarkup } from '../helpers/load-popup-markup.js';

function createChromeApi(overrides = {}) {
  return {
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

  it('initializes preference controls in the shipped popup markup', async () => {
    await import('../../popup.js');
    await Promise.resolve();
    await Promise.resolve();

    expect(document.getElementById('shortcut-list')).toBeNull();
    expect(document.getElementById('auto-confirm-trash').checked).toBe(true);
    expect(document.getElementById('auto-confirm-trash').disabled).toBe(false);
    expect(document.getElementById('open-conversation-on-focus').disabled).toBe(false);
    expect(document.getElementById('extension-version').textContent).toBe('Version 1.8.0');
  });

  it('includes the external guide link in shipped markup', async () => {
    await import('../../popup.js');
    await Promise.resolve();
    await Promise.resolve();

    const guideLink = document.getElementById('guide-link');

    expect(guideLink.getAttribute('href')).toBe('https://ravidorr.github.io/google-messages-shortcuts/');
    expect(guideLink.getAttribute('target')).toBe('_blank');
  });

  it('logs popup initialization failures', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    vi.resetModules();
    document.body.innerHTML = '';
    globalThis.chrome = createChromeApi();

    await import('../../popup.js');
    await Promise.resolve();
    await Promise.resolve();

    expect(warnSpy).toHaveBeenCalled();
  });
});
