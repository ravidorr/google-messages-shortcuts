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

export function resolveComposerEditor(
  documentRoot = document,
  candidateSelectors = COMPOSER_EDITOR_CANDIDATE_SELECTORS
) {
  const editors = [];

  for (const selector of candidateSelectors) {
    const matches = [...documentRoot.querySelectorAll(selector)];

    if (matches.length > 1) {
      return { editor: null, editors: [], matchCount: matches.length, state: 'unsafe' };
    }

    if (matches.length === 1) {
      editors.push(matches[0]);
    }
  }

  if (editors.length === 0) {
    return { editor: null, editors: [], matchCount: 0, state: 'unavailable' };
  }

  const editor =
    editors.find((candidate) => candidate.isContentEditable) ?? editors[0];

  return { editor, editors, matchCount: 1, state: 'supported' };
}
