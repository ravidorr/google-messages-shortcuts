import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildComposerEditorSelector,
  COMPOSER_EDITOR_CANDIDATE_SELECTORS,
  COMPOSER_HOST_TAG,
  getComposerEditorCandidateSelectors,
  resolveComposerEditor
} from '../../src/content/adapters/composer-dom.js';

describe('composer-dom', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('builds live-validated composer editor selectors', () => {
    const localThis = buildComposerEditorSelector();

    expect(localThis).toContain('textarea[aria-label*="Message" i]');
    expect(localThis).toContain('div[contenteditable="true"][aria-label*="Message" i]');
    expect(localThis).toContain(`${COMPOSER_HOST_TAG} textarea`);
    expect(localThis).not.toContain('data-e2e-message-input');
  });

  it('prefers the contenteditable candidate when GM also renders a textarea mirror', () => {
    document.body.innerHTML = `
      <textarea aria-label="Message"></textarea>
      <div contenteditable="true" aria-label="Message"></div>
    `;

    const localThis = resolveComposerEditor(document);

    expect(localThis.state).toBe('supported');
    expect(localThis.editor?.getAttribute('contenteditable')).toBe('true');
    expect(localThis.editors).toHaveLength(2);
  });

  it('falls back to contenteditable when no textarea is present', () => {
    document.body.innerHTML = `
      <div contenteditable="true" aria-label="Message"></div>
    `;

    const localThis = resolveComposerEditor(document);

    expect(localThis.state).toBe('supported');
    expect(localThis.editor?.getAttribute('contenteditable')).toBe('true');
  });

  it('returns unavailable when no candidate matches', () => {
    expect(resolveComposerEditor(document).state).toBe('unavailable');
  });

  it('returns unsafe when a single candidate matches multiple controls', () => {
    document.body.innerHTML = `
      <textarea aria-label="Message"></textarea>
      <textarea aria-label="Message"></textarea>
    `;

    expect(resolveComposerEditor(document).state).toBe('unsafe');
  });

  it('exports ordered candidate selectors for discovery probes', () => {
    expect(COMPOSER_EDITOR_CANDIDATE_SELECTORS.length).toBe(4);
  });

  it('supports explicit override selectors for fixtures', () => {
    document.body.innerHTML = `
      <textarea data-e2e-message-input></textarea>
      <textarea data-e2e-message-input></textarea>
    `;

    const localThis = resolveComposerEditor(
      document,
      getComposerEditorCandidateSelectors('textarea[data-e2e-message-input]')
    );

    expect(localThis.state).toBe('unsafe');
  });
});
