import { CAPABILITY_UNAVAILABLE, createCapabilityResult } from './capability-states.js';

export const MESSAGE_PANE_EVIDENCE_SOURCE = 'phase0-pending-live-validation';

export const MESSAGE_PANE_SELECTORS = {
  messageNode: null,
  scrollContainer: null
};

export const MESSAGE_PANE_CAPABILITY_IDS = {
  loadedSearch: 'messagePane.loadedSearch',
  highlightMatch: 'messagePane.highlightMatch',
  authorTimestamp: 'messagePane.authorTimestamp'
};

const MESSAGE_PANE_UNAVAILABLE_REASON =
  'Message pane selectors are not validated; complete live DOM discovery before enabling loaded-message search.';

export function assessMessagePaneCapabilities() {
  return {
    [MESSAGE_PANE_CAPABILITY_IDS.loadedSearch]: createCapabilityResult(
      CAPABILITY_UNAVAILABLE,
      MESSAGE_PANE_UNAVAILABLE_REASON,
      MESSAGE_PANE_EVIDENCE_SOURCE
    ),
    [MESSAGE_PANE_CAPABILITY_IDS.highlightMatch]: createCapabilityResult(
      CAPABILITY_UNAVAILABLE,
      MESSAGE_PANE_UNAVAILABLE_REASON,
      MESSAGE_PANE_EVIDENCE_SOURCE
    ),
    [MESSAGE_PANE_CAPABILITY_IDS.authorTimestamp]: createCapabilityResult(
      CAPABILITY_UNAVAILABLE,
      MESSAGE_PANE_UNAVAILABLE_REASON,
      MESSAGE_PANE_EVIDENCE_SOURCE
    )
  };
}
