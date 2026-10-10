// @vitest-environment node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import { GUIDE_URL } from '../helpers/guide-url.js';

const projectDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

describe('popup markup', () => {
  it('keeps settings controls, version, and an external guide link', async () => {
    const popupHtml = await readFile(path.join(projectDirectory, 'popup.html'), 'utf8');
    const document = new JSDOM(popupHtml).window.document;
    const sections = [...document.querySelectorAll('.popup__section')];
    const guideLink = document.getElementById('guide-link');

    expect(document.querySelector('.popup__subtitle')).toBeNull();
    expect(document.getElementById('shortcut-list')).toBeNull();
    expect(document.getElementById('shortcuts-link')).toBeNull();
    expect(guideLink.getAttribute('href')).toBe(GUIDE_URL);
    expect(guideLink.getAttribute('target')).toBe('_blank');
    expect(guideLink.getAttribute('rel')).toBe('noopener noreferrer');
    expect(document.querySelector('.popup__footer')).not.toBeNull();
    expect(document.getElementById('extension-version').closest('.popup__footer')).not.toBeNull();
    expect(document.getElementById('extension-version').className).toBe('popup__version');
    expect(document.getElementById('extension-version').hidden).toBe(true);
    expect(document.getElementById('reset-extension-preferences').classList.contains('popup__button--destructive')).toBe(true);
    expect(sections.map((section) => section.querySelector('.popup__section-title').textContent.trim()))
      .toEqual([
        'Trash confirmation',
        'Conversation opening',
        'Pill visibility',
        'Extension controls'
      ]);
  });
});
