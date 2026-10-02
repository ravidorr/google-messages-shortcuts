// @vitest-environment node

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { getApprovedCommands } from '../../src/content/row-action-registry.js';

const decisionsPath = fileURLToPath(
  new URL('../../docs/dom-discovery/phase1-action-decisions.md', import.meta.url)
);

describe('phase1 action decisions', () => {
  it('documents approve and defer gates for row actions', async () => {
    const localThis = await readFile(decisionsPath, 'utf8');

    expect(localThis).toContain('| Archive | **Approve** |');
    expect(localThis).toContain('| Mark as read (row menu) | **Block** |');
    expect(localThis).toContain('| Mark as read (open row) | **Approve** |');
    expect(localThis).toContain('| Block / report spam | **Defer** |');
    expect(localThis).toContain('Composer adapter | **Block**');
    expect(localThis).toContain('| Unarchive | **Approve** |');
    expect(getApprovedCommands()).toHaveLength(7);
  });
});
