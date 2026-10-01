import { describe, expect, it } from 'vitest';
import {
  assessMessagePaneCapabilities,
  MESSAGE_PANE_CAPABILITY_IDS,
  MESSAGE_PANE_EVIDENCE_SOURCE,
  MESSAGE_PANE_SELECTORS
} from '../../src/content/adapters/message-pane-adapter.js';
import { CAPABILITY_UNAVAILABLE } from '../../src/content/adapters/capability-states.js';

describe('message-pane-adapter', () => {
  it('keeps message pane capabilities unavailable until live validation', () => {
    const localThis = assessMessagePaneCapabilities();

    for (const capabilityId of Object.values(MESSAGE_PANE_CAPABILITY_IDS)) {
      expect(localThis[capabilityId]).toMatchObject({
        state: CAPABILITY_UNAVAILABLE,
        evidenceSource: MESSAGE_PANE_EVIDENCE_SOURCE
      });
    }
  });

  it('does not define unvalidated message pane selectors', () => {
    expect(MESSAGE_PANE_SELECTORS.messageNode).toBeNull();
    expect(MESSAGE_PANE_SELECTORS.scrollContainer).toBeNull();
  });
});
