import { CAPABILITY_UNAVAILABLE, createCapabilityResult } from './capability-states.js';

export const CONNECTION_EVIDENCE_SOURCE = 'phase0-pending-live-validation';

export const CONNECTION_SELECTORS = {
  statusBanner: null,
  pairingIndicator: null
};

export const CONNECTION_CAPABILITY_IDS = {
  pairingStatus: 'connection.pairingStatus'
};

const CONNECTION_UNAVAILABLE_REASON =
  'Connection status selectors are not validated; complete live DOM discovery before surfacing pairing diagnostics.';

export function assessConnectionCapabilities() {
  return {
    [CONNECTION_CAPABILITY_IDS.pairingStatus]: createCapabilityResult(
      CAPABILITY_UNAVAILABLE,
      CONNECTION_UNAVAILABLE_REASON,
      CONNECTION_EVIDENCE_SOURCE
    )
  };
}
