import { CAPABILITY_UNAVAILABLE, createCapabilityResult } from './capability-states.js';

export const COMPOSER_EVIDENCE_SOURCE = 'phase0-pending-live-validation';

export const COMPOSER_SELECTORS = {
  editor: null,
  sendButton: null
};

export const COMPOSER_CAPABILITY_IDS = {
  focus: 'composer.focus',
  readDraft: 'composer.readDraft',
  insertText: 'composer.insertText',
  sendState: 'composer.sendState'
};

const COMPOSER_UNAVAILABLE_REASON =
  'Composer selectors are not validated; complete live DOM discovery before enabling compose features.';

export function assessComposerCapabilities() {
  return {
    [COMPOSER_CAPABILITY_IDS.focus]: createCapabilityResult(
      CAPABILITY_UNAVAILABLE,
      COMPOSER_UNAVAILABLE_REASON,
      COMPOSER_EVIDENCE_SOURCE
    ),
    [COMPOSER_CAPABILITY_IDS.readDraft]: createCapabilityResult(
      CAPABILITY_UNAVAILABLE,
      COMPOSER_UNAVAILABLE_REASON,
      COMPOSER_EVIDENCE_SOURCE
    ),
    [COMPOSER_CAPABILITY_IDS.insertText]: createCapabilityResult(
      CAPABILITY_UNAVAILABLE,
      COMPOSER_UNAVAILABLE_REASON,
      COMPOSER_EVIDENCE_SOURCE
    ),
    [COMPOSER_CAPABILITY_IDS.sendState]: createCapabilityResult(
      CAPABILITY_UNAVAILABLE,
      COMPOSER_UNAVAILABLE_REASON,
      COMPOSER_EVIDENCE_SOURCE
    )
  };
}
