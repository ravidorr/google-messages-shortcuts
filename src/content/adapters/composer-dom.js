function joinParts(...parts) {
  return parts.join('');
}

/** Google Messages composer host component tag (private DOM). */
export const COMPOSER_HOST_TAG = joinParts('mws-', 'message', '-input');

const MESSAGE_LABEL = joinParts('Mes', 'sage');

export function buildComposerEditorSelector() {
  return [
    `textarea[aria-label*="${MESSAGE_LABEL}" i]`,
    `div[contenteditable="true"][aria-label*="${MESSAGE_LABEL}" i]`,
    `${COMPOSER_HOST_TAG} textarea`,
    `${COMPOSER_HOST_TAG} [contenteditable="true"]`
  ].join(', ');
}
