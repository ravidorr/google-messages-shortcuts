import { beforeEach, describe, expect, it } from 'vitest';
import {
  assessListCapabilities,
  LIST_CAPABILITY_IDS,
  LIST_SELECTORS
} from '../../src/content/adapters/list-adapter.js';
import { CAPABILITY_SUPPORTED, CAPABILITY_UNAVAILABLE, CAPABILITY_UNSAFE } from '../../src/content/adapters/capability-states.js';
import {
  emptyConversationList,
  rowMissingMenuButton,
  selectedReadRow
} from '../fixtures/dom/list-states.js';

describe('list-adapter', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('marks list capabilities unavailable when no rows exist', () => {
    document.body.innerHTML = emptyConversationList;
    const localThis = assessListCapabilities(document);

    expect(localThis[LIST_CAPABILITY_IDS.targeting].state).toBe(CAPABILITY_UNAVAILABLE);
    expect(localThis[LIST_CAPABILITY_IDS.unreadDetection].state).toBe(CAPABILITY_UNAVAILABLE);
  });

  it('marks list capabilities supported when rows expose menu buttons', () => {
    document.body.innerHTML = selectedReadRow;
    const localThis = assessListCapabilities(document);

    expect(localThis[LIST_CAPABILITY_IDS.targeting]).toMatchObject({
      state: CAPABILITY_SUPPORTED,
      evidenceSource: 'dom-structure'
    });
    expect(localThis[LIST_CAPABILITY_IDS.unreadDetection].state).toBe(CAPABILITY_SUPPORTED);
  });

  it('marks list capabilities unsafe when a row is missing its menu button', () => {
    document.body.innerHTML = rowMissingMenuButton;
    const localThis = assessListCapabilities(document);

    expect(localThis[LIST_CAPABILITY_IDS.targeting].state).toBe(CAPABILITY_UNSAFE);
    expect(localThis[LIST_CAPABILITY_IDS.unreadDetection].state).toBe(CAPABILITY_UNSAFE);
  });

  it('accepts custom selector overrides', () => {
    document.body.innerHTML = `
      <custom-row>
        <button aria-haspopup="menu"></button>
      </custom-row>
    `;
    const localThis = assessListCapabilities(document, {
      ...LIST_SELECTORS,
      conversationRow: 'custom-row',
      rowMenuButton: 'button[aria-haspopup="menu"]'
    });

    expect(localThis[LIST_CAPABILITY_IDS.targeting].state).toBe(CAPABILITY_SUPPORTED);
  });
});
