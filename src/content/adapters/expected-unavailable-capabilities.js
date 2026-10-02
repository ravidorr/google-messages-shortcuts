import { ARCHIVED_CAPABILITY_IDS } from './archived-adapter.js';
import { COMPOSER_CAPABILITY_IDS } from './composer-adapter.js';
import { CONNECTION_CAPABILITY_IDS } from './connection-adapter.js';
import { MESSAGE_PANE_CAPABILITY_IDS } from './message-pane-adapter.js';
import { SPAM_BLOCKED_CAPABILITY_IDS } from './spam-blocked-adapter.js';

export const EXPECTED_UNAVAILABLE_CAPABILITY_IDS = new Set([
  ...Object.values(COMPOSER_CAPABILITY_IDS),
  ...Object.values(MESSAGE_PANE_CAPABILITY_IDS),
  ...Object.values(CONNECTION_CAPABILITY_IDS),
  ARCHIVED_CAPABILITY_IDS.modalOpen,
  ARCHIVED_CAPABILITY_IDS.unarchive,
  SPAM_BLOCKED_CAPABILITY_IDS.entry
]);

export function isExpectedUnavailableCapability(capabilityId) {
  return EXPECTED_UNAVAILABLE_CAPABILITY_IDS.has(capabilityId);
}
