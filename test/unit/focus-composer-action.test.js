import { beforeEach, describe, expect, it } from 'vitest';
import { COMPOSER_SELECTORS } from '../../src/content/adapters/composer-adapter.js';
import { findComposerEditor, focusComposer } from '../../src/content/focus-composer-action.js';
import { composerEditorSurface } from '../fixtures/dom/list-states.js';

describe('focus-composer-action', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('fails closed when no composer editor is present', () => {
    const localThis = focusComposer(document, COMPOSER_SELECTORS);

    expect(localThis.ok).toBe(false);
    expect(localThis.reason).toBe('composer-unavailable');
  });

  it('focuses a uniquely matched composer editor with live-validated selectors', () => {
    document.body.innerHTML = composerEditorSurface;

    const localThis = focusComposer(document, COMPOSER_SELECTORS);

    expect(localThis.ok).toBe(true);
    expect(document.activeElement.matches('textarea[aria-label="Message"]')).toBe(true);
  });

  it('fails closed when multiple composer editors match', () => {
    document.body.innerHTML = `
      <textarea aria-label="Message"></textarea>
      <textarea aria-label="Message"></textarea>
    `;

    const localThis = focusComposer(document, COMPOSER_SELECTORS);

    expect(localThis.ok).toBe(false);
    expect(localThis.reason).toBe('composer-ambiguous');
  });

  it('finds a uniquely matched composer editor', () => {
    document.body.innerHTML = composerEditorSurface;

    expect(findComposerEditor(document, COMPOSER_SELECTORS)?.matches('textarea[aria-label="Message"]'))
      .toBe(true);
  });

  it('returns null when composer selectors are not configured', () => {
    expect(findComposerEditor(document, { editor: null, sendButton: null })).toBeNull();
  });
});
