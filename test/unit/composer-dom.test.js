import { describe, expect, it } from 'vitest';
import {
  buildComposerEditorSelector,
  COMPOSER_HOST_TAG
} from '../../src/content/adapters/composer-dom.js';

describe('composer-dom', () => {
  it('builds live-validated composer editor selectors', () => {
    const localThis = buildComposerEditorSelector();

    expect(localThis).toContain('textarea[aria-label*="Message" i]');
    expect(localThis).toContain('div[contenteditable="true"][aria-label*="Message" i]');
    expect(localThis).toContain(`${COMPOSER_HOST_TAG} textarea`);
    expect(localThis).not.toContain('data-e2e-message-input');
  });
});
