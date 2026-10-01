// @vitest-environment node

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import * as listFixtures from '../fixtures/dom/list-states.js';

const FORBIDDEN_PATTERNS = [
  /\+1\d{10}/,
  /\(\d{3}\)\s*\d{3}-\d{4}(?!010-0000)/,
  /@[a-z0-9.-]+\.(com|net|org)/i,
  /gmail\.com/i,
  /messages\.google/i
];

const fixturePath = fileURLToPath(new URL('../fixtures/dom/list-states.js', import.meta.url));

describe('fixture sanitization', () => {
  it('exports named list fixtures for every documented scenario', () => {
    for (const exportName of listFixtures.FIXTURE_EXPORT_NAMES) {
      expect(typeof listFixtures[exportName]).toBe('string');
    }
  });

  it('contains no personal identifiers or live hostnames in fixtures', () => {
    for (const exportName of listFixtures.FIXTURE_EXPORT_NAMES) {
      const html = listFixtures[exportName];

      for (const pattern of FORBIDDEN_PATTERNS) {
        expect(html).not.toMatch(pattern);
      }
    }
  });

  it('documents sanitization rules in the repository', async () => {
    const localThis = await readFile(
      fileURLToPath(new URL('../../docs/dom-discovery/fixture-sanitization.md', import.meta.url)),
      'utf8'
    );

    expect(localThis).toContain('data-e2e-*');
    expect(localThis).toContain('Sample message text');
  });

  it('loads fixture source from the expected module path', async () => {
    const localThis = await readFile(fixturePath, 'utf8');

    expect(localThis).toContain('fullListActionSurface');
  });
});
