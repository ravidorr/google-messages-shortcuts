import {
  CAPABILITY_SUPPORTED,
  CAPABILITY_UNAVAILABLE,
  CAPABILITY_UNSAFE,
  createCapabilityResult
} from './capability-states.js';

export const COMPOSER_EVIDENCE_SOURCE = 'phase2-pending-live-validation';
export const COMPOSER_SPIKE_EVIDENCE_SOURCE = 'phase2-composer-discovery-spike';

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

function assessSelectorCapability(documentRoot, selector, capabilityLabel) {
  if (!selector) {
    return createCapabilityResult(
      CAPABILITY_UNAVAILABLE,
      COMPOSER_UNAVAILABLE_REASON,
      COMPOSER_EVIDENCE_SOURCE
    );
  }

  const matches = documentRoot.querySelectorAll(selector);

  if (matches.length === 0) {
    return createCapabilityResult(
      CAPABILITY_UNAVAILABLE,
      `No ${capabilityLabel} control found in the current view.`,
      'dom-query'
    );
  }

  if (matches.length > 1) {
    return createCapabilityResult(
      CAPABILITY_UNSAFE,
      `Multiple ${capabilityLabel} controls matched.`,
      'dom-query'
    );
  }

  return createCapabilityResult(
    CAPABILITY_SUPPORTED,
    `${capabilityLabel} control is uniquely available.`,
    'dom-query'
  );
}

export function assessComposerCapabilities(
  documentRoot = document,
  selectors = COMPOSER_SELECTORS
) {
  const focus = assessSelectorCapability(documentRoot, selectors.editor, 'composer editor');
  const sendState = assessSelectorCapability(documentRoot, selectors.sendButton, 'send');

  if (focus.state !== CAPABILITY_SUPPORTED) {
    return {
      [COMPOSER_CAPABILITY_IDS.focus]: focus,
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
      [COMPOSER_CAPABILITY_IDS.sendState]: sendState
    };
  }

  return {
    [COMPOSER_CAPABILITY_IDS.focus]: focus,
    [COMPOSER_CAPABILITY_IDS.readDraft]: createCapabilityResult(
      CAPABILITY_UNAVAILABLE,
      'Draft read behavior is not validated in Phase 2.',
      COMPOSER_SPIKE_EVIDENCE_SOURCE
    ),
    [COMPOSER_CAPABILITY_IDS.insertText]: createCapabilityResult(
      CAPABILITY_UNAVAILABLE,
      'Draft insertion is not validated in Phase 2.',
      COMPOSER_SPIKE_EVIDENCE_SOURCE
    ),
    [COMPOSER_CAPABILITY_IDS.sendState]: sendState
  };
}
