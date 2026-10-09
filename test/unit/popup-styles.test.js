// @vitest-environment node

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const popupStylesPath = fileURLToPath(new URL('../../popup.css', import.meta.url));

describe('popup shortcut status styles', () => {
  it('uses contrasting assigned and missing status tokens in each color scheme', async () => {
    const popupStyles = await readFile(popupStylesPath, 'utf8');

    expect(popupStyles).toContain(
      '.shortcut-status--assigned {\n  background: var(--color-popup-assigned-bg);\n  color: var(--color-popup-assigned-text);'
    );
    expect(popupStyles).toContain(
      '.shortcut-status--missing {\n    background: var(--color-popup-warning-bg);\n    color: var(--color-popup-warning-text);'
    );
  });
});
