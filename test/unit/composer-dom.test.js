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
      <${COMPOSER_HOST_TAG}>
        <textarea aria-label="Message"></textarea>
        <div contenteditable="true" aria-label="Message"></div>
      </${COMPOSER_HOST_TAG}>
    `;

    const localThis = resolveComposerEditor(document);

    expect(localThis.state).toBe('supported');
    expect(localThis.editor?.getAttribute('contenteditable')).toBe('true');
    expect(localThis.editors).toHaveLength(2);
  });

  it('returns unsafe when distinct editors are not a textarea/contenteditable mirror pair', () => {
    document.body.innerHTML = `
      <div contenteditable="true" aria-label="Message"></div>
      <${COMPOSER_HOST_TAG}>
        <div contenteditable="true"></div>
      </${COMPOSER_HOST_TAG}>
    `;

    expect(resolveComposerEditor(document).state).toBe('unsafe');
  });

  it('returns unsafe when textarea and contenteditable mirrors belong to different composer hosts', () => {
    document.body.innerHTML = `
      <${COMPOSER_HOST_TAG}>
        <textarea aria-label="Message"></textarea>
      </${COMPOSER_HOST_TAG}>
      <${COMPOSER_HOST_TAG}>
        <div contenteditable="true" aria-label="Message"></div>
      </${COMPOSER_HOST_TAG}>
    `;

    expect(resolveComposerEditor(document).state).toBe('unsafe');
  });

  it('returns unsafe when more than two distinct composer editors match', () => {
    document.body.innerHTML = `
      <textarea aria-label="Message"></textarea>
      <div contenteditable="true" aria-label="Message"></div>
      <mws-message-input>
        <div contenteditable="true"></div>
      </mws-message-input>
    `;

    expect(resolveComposerEditor(document).state).toBe('unsafe');
  });

  it('returns unsafe when multiple distinct composer editors match', () => {
    document.body.innerHTML = `
      <div contenteditable="true" aria-label="Message"></div>
      <div contenteditable="true" aria-label="Message"></div>
    `;

    expect(resolveComposerEditor(document).state).toBe('unsafe');
  });

  it('supports a single textarea editor when no contenteditable candidate is present', () => {
    document.body.innerHTML = `
      <textarea aria-label="Message"></textarea>
    `;

    const localThis = resolveComposerEditor(document);

    expect(localThis.state).toBe('supported');
    expect(localThis.editor?.tagName).toBe('TEXTAREA');
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
