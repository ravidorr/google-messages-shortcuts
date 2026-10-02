import { beforeEach, describe, expect, it } from 'vitest';
import {
  assessComposerCapabilities,
  COMPOSER_CAPABILITY_IDS,
  COMPOSER_SELECTORS
} from '../../src/content/adapters/composer-adapter.js';
import {
  CAPABILITY_SUPPORTED,
  CAPABILITY_UNAVAILABLE,
  CAPABILITY_UNSAFE
} from '../../src/content/adapters/capability-states.js';
import { composerEditorSurface } from '../fixtures/dom/list-states.js';

describe('composer-adapter', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('defines live-validated composer editor selectors', () => {
    expect(COMPOSER_SELECTORS.editor).toContain('textarea[aria-label*="Message" i]');
    expect(COMPOSER_SELECTORS.sendButton).toBeNull();
  });

  it('reports composer focus unavailable when no editor is present', () => {
    const localThis = assessComposerCapabilities(document, COMPOSER_SELECTORS);

    expect(localThis[COMPOSER_CAPABILITY_IDS.focus].state).toBe(CAPABILITY_UNAVAILABLE);
    expect(localThis[COMPOSER_CAPABILITY_IDS.readDraft].state).toBe(CAPABILITY_UNAVAILABLE);
    expect(localThis[COMPOSER_CAPABILITY_IDS.insertText].state).toBe(CAPABILITY_UNAVAILABLE);
  });

  it('supports composer focus on the live-validated editor surface', () => {
    document.body.innerHTML = composerEditorSurface;

    const localThis = assessComposerCapabilities(document, COMPOSER_SELECTORS);

    expect(localThis[COMPOSER_CAPABILITY_IDS.focus].state).toBe(CAPABILITY_SUPPORTED);
    expect(localThis[COMPOSER_CAPABILITY_IDS.readDraft].state).toBe(CAPABILITY_UNAVAILABLE);
    expect(localThis[COMPOSER_CAPABILITY_IDS.insertText].state).toBe(CAPABILITY_UNAVAILABLE);
  });

  it('reports deferred focus and send-state probe branches for custom selectors', () => {
    const unavailableSend = assessComposerCapabilities(document, {
      editor: null,
      sendButton: 'button[data-e2e-send-button]'
    });

    expect(unavailableSend[COMPOSER_CAPABILITY_IDS.focus].state).toBe(CAPABILITY_UNAVAILABLE);
    expect(unavailableSend[COMPOSER_CAPABILITY_IDS.sendState].state).toBe(CAPABILITY_UNAVAILABLE);

    document.body.innerHTML = `
      <button data-e2e-send-button></button>
      <button data-e2e-send-button></button>
    `;

    const unsafeSend = assessComposerCapabilities(document, {
      editor: null,
      sendButton: 'button[data-e2e-send-button]'
    });

    expect(unsafeSend[COMPOSER_CAPABILITY_IDS.sendState].state).toBe(CAPABILITY_UNSAFE);
  });

  it('assesses explicit e2e selectors when provided for fixtures', () => {
    document.body.innerHTML = `
      <textarea data-e2e-message-input></textarea>
      <button data-e2e-send-button></button>
    `;

    const localThis = assessComposerCapabilities(document, {
      editor: 'textarea[data-e2e-message-input]',
      sendButton: 'button[data-e2e-send-button]'
    });

    expect(localThis[COMPOSER_CAPABILITY_IDS.focus].state).not.toBe(CAPABILITY_UNAVAILABLE);
    expect(localThis[COMPOSER_CAPABILITY_IDS.sendState].state).not.toBe(CAPABILITY_UNAVAILABLE);
  });
});
