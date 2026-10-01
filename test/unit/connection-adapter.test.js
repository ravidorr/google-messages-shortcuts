import { describe, expect, it } from 'vitest';
import {
  assessConnectionCapabilities,
  CONNECTION_CAPABILITY_IDS,
  CONNECTION_EVIDENCE_SOURCE,
  CONNECTION_SELECTORS
} from '../../src/content/adapters/connection-adapter.js';
import { CAPABILITY_UNAVAILABLE } from '../../src/content/adapters/capability-states.js';

describe('connection-adapter', () => {
  it('keeps connection capabilities unavailable until live validation', () => {
    const localThis = assessConnectionCapabilities();

    expect(localThis[CONNECTION_CAPABILITY_IDS.pairingStatus]).toMatchObject({
      state: CAPABILITY_UNAVAILABLE,
      evidenceSource: CONNECTION_EVIDENCE_SOURCE
    });
  });

  it('does not define unvalidated connection selectors', () => {
    expect(CONNECTION_SELECTORS.statusBanner).toBeNull();
    expect(CONNECTION_SELECTORS.pairingIndicator).toBeNull();
  });
});
