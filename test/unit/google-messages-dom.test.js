import { describe, expect, it } from 'vitest';
import {
  LIST_SELECTORS,
  MENU_SELECTORS,
  MENU_TEXT,
  SELECTORS
} from '../../src/content/google-messages-dom.js';

describe('google-messages-dom', () => {
  it('merges list and menu selectors for backward compatibility', () => {
    const localThis = SELECTORS;

    expect(localThis.conversationRow).toBe(LIST_SELECTORS.conversationRow);
    expect(localThis.archiveMenuItem).toBe(MENU_SELECTORS.archiveMenuItem);
    expect(MENU_TEXT.archive).toBe('Archive');
  });
});
