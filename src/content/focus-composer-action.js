import {
  assessComposerCapabilities,
  COMPOSER_CAPABILITY_IDS,
  COMPOSER_SELECTORS
} from './adapters/composer-adapter.js';
import {
  getComposerEditorCandidateSelectors,
  resolveComposerEditor
} from './adapters/composer-dom.js';
import {
  CAPABILITY_SUPPORTED,
  CAPABILITY_UNSAFE
} from './adapters/capability-states.js';

export function findComposerEditor(documentRoot, selectors = COMPOSER_SELECTORS) {
  if (!selectors.editor) {
    return null;
  }

  const resolution = resolveComposerEditor(
    documentRoot,
    getComposerEditorCandidateSelectors(selectors.editor)
  );

  if (resolution.state !== 'supported') {
    return null;
  }

  return resolution.editor;
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

  const resolution = resolveComposerEditor(
    documentRoot,
    getComposerEditorCandidateSelectors(selectors.editor)
  );
  const { editor, editors } = resolution;

  if (!editor || editors.length === 0) {
    return { ok: false, reason: 'composer-not-found' };
  }

  const focusOrder = [
    editor,
    ...editors.filter((candidate) => candidate !== editor)
  ];

  for (const editor of focusOrder) {
    editor.focus({ preventScroll: false });

    if (editors.includes(documentRoot.activeElement)) {
      return { ok: true };
    }
  }

  return { ok: false, reason: 'composer-not-found' };
}
