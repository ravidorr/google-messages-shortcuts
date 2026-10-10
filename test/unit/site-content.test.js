// @vitest-environment node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import { PAGE_KEY_BINDINGS } from '../../src/shared/page-keymap.js';

const projectDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const MANIFEST_DEFAULT_COMMANDS = [
  'archive-conversation',
  'trash-conversation',
  'mark-read-conversation',
  'mark-unread-conversation'
];

describe('support site content', () => {
  it('documents manifest default Chrome shortcuts', async () => {
    const [siteHtml, manifest] = await Promise.all([
      readFile(path.join(projectDirectory, 'site/index.html'), 'utf8'),
      readFile(path.join(projectDirectory, 'manifest.json'), 'utf8').then((raw) => JSON.parse(raw))
    ]);

    const chromeShortcutsSection = new JSDOM(siteHtml).window.document
      .getElementById('chrome-shortcuts');
    const shortcutText = chromeShortcutsSection.textContent;

    for (const commandName of MANIFEST_DEFAULT_COMMANDS) {
      const suggestedKey = manifest.commands[commandName]?.suggested_key;

      expect(suggestedKey?.default, commandName).toBeTruthy();
      expect(suggestedKey?.mac, commandName).toBeTruthy();
      expect(shortcutText).toContain(suggestedKey.default);
      expect(shortcutText).toContain(suggestedKey.mac);
    }
  });

  it('documents page-local shortcut labels from the keymap', async () => {
    const siteHtml = await readFile(path.join(projectDirectory, 'site/index.html'), 'utf8');
    const document = new JSDOM(siteHtml).window.document;
    const navigationSection = document.getElementById('page-navigation');

    for (const binding of PAGE_KEY_BINDINGS) {
      expect(navigationSection.textContent).toContain(binding.label);
    }
  });
});
