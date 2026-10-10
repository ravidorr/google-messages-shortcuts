// @vitest-environment node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';

const projectDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

describe('support site markup', () => {
  it('includes guide sections and safe external links', async () => {
    const siteHtml = await readFile(path.join(projectDirectory, 'site/index.html'), 'utf8');
    const document = new JSDOM(siteHtml).window.document;
    const sectionIds = [...document.querySelectorAll('.site-section')].map((section) => section.id);
    const externalLinks = [...document.querySelectorAll('a[target="_blank"]')];

    expect(sectionIds).toEqual([
      'actions',
      'chrome-shortcuts',
      'page-navigation',
      'preferences',
      'limitations',
      'privacy',
      'install',
      'support'
    ]);
    expect(externalLinks.length).toBeGreaterThan(0);
    for (const link of externalLinks) {
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    }
    expect(document.querySelector('link[href="site.css"]')).not.toBeNull();
  });
});
