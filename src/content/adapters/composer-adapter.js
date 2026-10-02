import {
  buildComposerEditorSelector,
  getComposerEditorCandidateSelectors,
  resolveComposerEditor
} from './composer-dom.js';
import {
  CAPABILITY_SUPPORTED,
  CAPABILITY_UNAVAILABLE,
  CAPABILITY_UNSAFE,
  createCapabilityResult
} from './capability-states.js';

export const COMPOSER_EVIDENCE_SOURCE = 'phase2-live-validation-2026-10-03';
export const COMPOSER_SPIKE_EVIDENCE_SOURCE = 'phase2-composer-discovery-spike';

export const COMPOSER_SELECTORS = {
  editor: buildComposerEditorSelector(),
  sendButton: null
};

export const COMPOSER_CAPABILITY_IDS = {
  focus: 'composer.focus',
  readDraft: 'composer.readDraft',
  insertText: 'composer.insertText',
  sendState: 'composer.sendState'
};

const COMPOSER_DEFERRED_CAPABILITY_REASON =
  'Draft read and insert behavior is not validated in Phase 2.';

function assessSelectorCapability(documentRoot, selector, capabilityLabel) {
  if (!selector) {
    return createCapabilityResult(
      CAPABILITY_UNAVAILABLE,
      COMPOSER_DEFERRED_CAPABILITY_REASON,
      COMPOSER_SPIKE_EVIDENCE_SOURCE
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

function assessComposerFocusCapability(documentRoot, selectors = COMPOSER_SELECTORS) {
  if (!selectors.editor) {
    return createCapabilityResult(
      CAPABILITY_UNAVAILABLE,
      COMPOSER_DEFERRED_CAPABILITY_REASON,
      COMPOSER_SPIKE_EVIDENCE_SOURCE
    );
  }

  const resolution = resolveComposerEditor(
    documentRoot,
    getComposerEditorCandidateSelectors(selectors.editor)
  );

  if (resolution.state === 'unavailable') {
    return createCapabilityResult(
      CAPABILITY_UNAVAILABLE,
      'No composer editor control found in the current view.',
      'dom-query'
    );
  }

  if (resolution.state === 'unsafe') {
    return createCapabilityResult(
      CAPABILITY_UNSAFE,
      'Multiple composer editor controls matched.',
      'dom-query'
    );
  }

  return createCapabilityResult(
    CAPABILITY_SUPPORTED,
    'composer editor control is uniquely available.',
    'dom-query'
  );
}

export function assessComposerCapabilities(
  documentRoot = document,
  selectors = COMPOSER_SELECTORS
) {
  const focus = assessComposerFocusCapability(documentRoot, selectors);
  const sendState = assessSelectorCapability(documentRoot, selectors.sendButton, 'send');

  if (focus.state !== CAPABILITY_SUPPORTED) {
    return {
      [COMPOSER_CAPABILITY_IDS.focus]: focus,
      [COMPOSER_CAPABILITY_IDS.readDraft]: createCapabilityResult(
        CAPABILITY_UNAVAILABLE,
        COMPOSER_DEFERRED_CAPABILITY_REASON,
        COMPOSER_SPIKE_EVIDENCE_SOURCE
      ),
      [COMPOSER_CAPABILITY_IDS.insertText]: createCapabilityResult(
        CAPABILITY_UNAVAILABLE,
        COMPOSER_DEFERRED_CAPABILITY_REASON,
        COMPOSER_SPIKE_EVIDENCE_SOURCE
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
