import {
  assessComposerCapabilities,
  COMPOSER_CAPABILITY_IDS,
  COMPOSER_SELECTORS
} from './adapters/composer-adapter.js';
import {
  CAPABILITY_SUPPORTED,
  CAPABILITY_UNSAFE
} from './adapters/capability-states.js';

export function findComposerEditor(documentRoot, selectors = COMPOSER_SELECTORS) {
  if (!selectors.editor) {
    return null;
  }

  const matches = [...documentRoot.querySelectorAll(selectors.editor)];

  if (matches.length !== 1) {
    return null;
  }

  return matches[0];
}

export function focusComposer(documentRoot, selectors = COMPOSER_SELECTORS) {
  const capabilities = assessComposerCapabilities(documentRoot, selectors);
  const focusCapability = capabilities[COMPOSER_CAPABILITY_IDS.focus];

  if (focusCapability.state === CAPABILITY_UNSAFE) {
    return { ok: false, reason: 'composer-ambiguous' };
  }

  if (focusCapability.state !== CAPABILITY_SUPPORTED) {
    return { ok: false, reason: 'composer-unavailable' };
  }

  const editor = findComposerEditor(documentRoot, selectors);

  if (!editor) {
    return { ok: false, reason: 'composer-not-found' };
  }

  editor.focus({ preventScroll: false });

  if (documentRoot.activeElement !== editor) {
    return { ok: false, reason: 'composer-not-found' };
  }

  return { ok: true };
}
