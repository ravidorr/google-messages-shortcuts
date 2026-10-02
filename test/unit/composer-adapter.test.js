import { beforeEach, describe, expect, it } from 'vitest';
import {
  assessComposerCapabilities,
  COMPOSER_CAPABILITY_IDS,
  COMPOSER_SELECTORS
} from '../../src/content/adapters/composer-adapter.js';
import { CAPABILITY_UNAVAILABLE } from '../../src/content/adapters/capability-states.js';

describe('composer-adapter', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('keeps compose capabilities unavailable until live validation', () => {
    const localThis = assessComposerCapabilities(document, COMPOSER_SELECTORS);

    for (const capabilityId of Object.values(COMPOSER_CAPABILITY_IDS)) {
      expect(localThis[capabilityId].state).toBe(CAPABILITY_UNAVAILABLE);
    }
  });

  it('assesses validated composer selectors from the live DOM', () => {
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

  it('does not define unvalidated composer selectors', () => {
    expect(COMPOSER_SELECTORS.editor).toBeNull();
    expect(COMPOSER_SELECTORS.sendButton).toBeNull();
  });
});
