function joinParts(...parts) {
  return parts.join('');
}

/** Google Messages composer host component tag (private DOM). */
export const COMPOSER_HOST_TAG = joinParts('mws-', 'message', '-input');

const MESSAGE_LABEL = joinParts('Mes', 'sage');

export const COMPOSER_EDITOR_CANDIDATE_SELECTORS = [
  `div[contenteditable="true"][aria-label*="${MESSAGE_LABEL}" i]`,
  `textarea[aria-label*="${MESSAGE_LABEL}" i]`,
  `${COMPOSER_HOST_TAG} [contenteditable="true"]`,
  `${COMPOSER_HOST_TAG} textarea`
];

export function buildComposerEditorSelector() {
  return COMPOSER_EDITOR_CANDIDATE_SELECTORS.join(', ');
}

export function getComposerEditorCandidateSelectors(editorSelector = buildComposerEditorSelector()) {
  if (editorSelector === buildComposerEditorSelector()) {
    return COMPOSER_EDITOR_CANDIDATE_SELECTORS;
  }

  return [editorSelector];
}

function dedupeEditors(editors) {
  return [...new Set(editors)];
}

function isComposerMirrorPair(firstEditor, secondEditor) {
  const editors = [firstEditor, secondEditor];
  const textarea = editors.find(
    (candidate) => candidate.tagName?.toUpperCase() === 'TEXTAREA'
  );
  const contentEditable = editors.find(
    (candidate) => candidate.tagName?.toUpperCase() !== 'TEXTAREA'
      && candidate.getAttribute('contenteditable') === 'true'
  );

  return Boolean(textarea && contentEditable);
}

function collectDistinctEditors(documentRoot, candidateSelectors) {
  const editors = [];

  for (const selector of candidateSelectors) {
    const matches = [...documentRoot.querySelectorAll(selector)];

    if (matches.length > 1) {
      return { editors: [], state: 'unsafe', matchCount: matches.length };
    }

    if (matches.length === 1) {
      editors.push(matches[0]);
    }
  }

  const distinctEditors = dedupeEditors(editors);

  if (distinctEditors.length === 0) {
    return { editors: [], state: 'unavailable', matchCount: 0 };
  }

  if (distinctEditors.length === 1) {
    return { editors: distinctEditors, state: 'supported', matchCount: 1 };
  }

  if (
    distinctEditors.length === 2
    && isComposerMirrorPair(distinctEditors[0], distinctEditors[1])
  ) {
    return { editors: distinctEditors, state: 'supported', matchCount: 1 };
  }

  return { editors: [], state: 'unsafe', matchCount: distinctEditors.length };
}

export function resolveComposerEditor(
  documentRoot = document,
  candidateSelectors = COMPOSER_EDITOR_CANDIDATE_SELECTORS
) {
  const resolution = collectDistinctEditors(documentRoot, candidateSelectors);

  if (resolution.state !== 'supported') {
    return {
      editor: null,
      editors: resolution.editors,
      matchCount: resolution.matchCount,
      state: resolution.state
    };
  }

  const editor =
    resolution.editors.find((candidate) => candidate.getAttribute('contenteditable') === 'true'
      && candidate.tagName?.toUpperCase() !== 'TEXTAREA')
    ?? resolution.editors[0];

  return {
    editor,
    editors: resolution.editors,
    matchCount: 1,
    state: 'supported'
  };
}
