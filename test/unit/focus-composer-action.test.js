import { beforeEach, describe, expect, it } from 'vitest';
import { COMPOSER_SELECTORS } from '../../src/content/adapters/composer-adapter.js';
import { focusComposer } from '../../src/content/focus-composer-action.js';
import { composerEditorSurface } from '../fixtures/dom/list-states.js';

describe('focus-composer-action', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('fails closed when composer selectors are unavailable', async () => {
    const localThis = focusComposer(document, COMPOSER_SELECTORS);

    expect(localThis.ok).toBe(false);
    expect(localThis.reason).toBe('composer-unavailable');
  });

  it('focuses a uniquely matched composer editor when selectors are validated', () => {
    document.body.innerHTML = composerEditorSurface;

    const localThis = focusComposer(document, {
      editor: 'textarea[data-e2e-message-input]',
      sendButton: 'button[data-e2e-send-button]'
    });

    expect(localThis.ok).toBe(true);
    expect(document.activeElement.matches('textarea[data-e2e-message-input]')).toBe(true);
  });
});
