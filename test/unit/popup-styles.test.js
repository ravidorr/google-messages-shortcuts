// @vitest-environment node

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const popupStylesPath = fileURLToPath(new URL('../../popup.css', import.meta.url));

describe('popup styles', () => {
  it('styles the guide link and version with popup tokens', async () => {
    const popupStyles = await readFile(popupStylesPath, 'utf8');

    expect(popupStyles).toContain('.popup__guide-link {\n  color: var(--color-popup-link);');
    expect(popupStyles).toContain('font-weight: 600;');
    expect(popupStyles).toContain('.popup__footer {');
    expect(popupStyles).toContain('.popup__button--destructive {');
    expect(popupStyles).toContain('color: var(--color-danger);');
    expect(popupStyles).toContain('.popup__version {\n  margin: 0;');
    expect(popupStyles).not.toContain('.shortcut-list');
  });
});
