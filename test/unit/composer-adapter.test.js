import { describe, expect, it } from 'vitest';
import {
  assessComposerCapabilities,
  COMPOSER_CAPABILITY_IDS,
  COMPOSER_EVIDENCE_SOURCE,
  COMPOSER_SELECTORS
} from '../../src/content/adapters/composer-adapter.js';
import { CAPABILITY_UNAVAILABLE } from '../../src/content/adapters/capability-states.js';

describe('composer-adapter', () => {
  it('keeps compose capabilities unavailable until live validation', () => {
    const localThis = assessComposerCapabilities();

    for (const capabilityId of Object.values(COMPOSER_CAPABILITY_IDS)) {
      expect(localThis[capabilityId]).toMatchObject({
        state: CAPABILITY_UNAVAILABLE,
        evidenceSource: COMPOSER_EVIDENCE_SOURCE
      });
    }
  });

  it('does not define unvalidated composer selectors', () => {
    expect(COMPOSER_SELECTORS.editor).toBeNull();
    expect(COMPOSER_SELECTORS.sendButton).toBeNull();
  });
});
