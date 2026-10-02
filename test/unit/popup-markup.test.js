// @vitest-environment node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';

const projectDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

describe('popup markup', () => {
  it('places shortcut help directly after the keyboard shortcut table', async () => {
    const popupHtml = await readFile(path.join(projectDirectory, 'popup.html'), 'utf8');
    const document = new JSDOM(popupHtml).window.document;
    const sections = [...document.querySelectorAll('.popup__section')];

    expect(document.querySelector('.popup__subtitle').textContent.trim())
      .toBe('Archive, trash, mute, or mark Google Messages conversations from the list.');
    expect(document.getElementById('extension-version').className).toBe('popup__version');
    expect(document.getElementById('extension-version').hidden).toBe(true);
    expect(sections.map((section) => section.querySelector('.popup__section-title').textContent.trim()))
      .toEqual([
        'Keyboard shortcuts',
        'Navigation shortcuts',
        'Change shortcuts',
        'Trash confirmation',
        'Conversation opening',
        'Extension controls'
      ]);
  });
});
