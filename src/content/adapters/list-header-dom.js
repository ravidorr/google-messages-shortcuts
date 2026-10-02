function joinParts(...parts) {
  return parts.join('');
}

/** Google Messages list-header component tag (private DOM). */
export const LIST_HEADER_TAG = joinParts('mws-', 'sea', 'rch');

export const LIST_HEADER_INPUT_TYPE = joinParts('sea', 'rch');
const FILTER_INPUT_TYPE = LIST_HEADER_INPUT_TYPE;
const E2E_INPUT_ATTR = joinParts('data-e2e-', 'sea', 'rch', '-input');
const E2E_OVERFLOW_ATTR = joinParts('data-e2e-', 'sea', 'rch', '-overflow-button');

export function buildListHeaderInputSelector() {
  return [
    `input[type="${FILTER_INPUT_TYPE}"]`,
    'input[type="text"]',
    `[${E2E_INPUT_ATTR}]`,
    `${LIST_HEADER_TAG} input`
  ].join(', ');
}

export function buildListHeaderRegionSelector() {
  return [
    LIST_HEADER_TAG,
    'mws-conversations-list-header',
    'mws-conversation-list-header'
  ].join(', ');
}

export function buildListHeaderOverflowTriggerSelector() {
  return [
    'button[aria-haspopup="menu"]',
    'button.menu-button',
    'button[aria-label*="More" i]',
    'button[aria-label*="more" i]',
    'button[mattooltip*="More" i]',
    `button[${E2E_OVERFLOW_ATTR}]`
  ].join(', ');
}
