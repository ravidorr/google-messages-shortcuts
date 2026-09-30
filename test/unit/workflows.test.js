// @vitest-environment node

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const workflowsDirectory = fileURLToPath(new URL('../../.github/workflows', import.meta.url));
const pinnedExternalActionPattern = /^[^/\s]+\/[^@\s]+@[0-9a-f]{40}(?:\s+#\s+v\d+(?:\.\d+)*)?$/;

async function readWorkflowFiles() {
  const entries = await readdir(workflowsDirectory);

  return Promise.all(entries
    .filter((entry) => entry.endsWith('.yml') || entry.endsWith('.yaml'))
    .map(async (entry) => ({
      name: entry,
      content: await readFile(path.join(workflowsDirectory, entry), 'utf8')
    })));
}

function getActionUses(content) {
  return [...content.matchAll(/^\s*(?:-\s*)?uses:\s*(.+)$/gm)]
    .map((match) => match[1].trim())
    .filter((actionUse) => !actionUse.startsWith('./') && !actionUse.startsWith('docker://'));
}

describe('GitHub workflow security', () => {
  it('collects step and job uses declarations with flexible spacing', () => {
    const localThis = {
      content: [
        'jobs:',
        '  report:',
        '    uses: owner/reusable-workflow@aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        '    steps:',
        '      - uses:    actions/checkout@bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        '      - uses: ./scripts/local-action',
        '      - uses: docker://node:22'
      ].join('\n')
    };

    expect(getActionUses(localThis.content)).toEqual([
      'owner/reusable-workflow@aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'actions/checkout@bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
    ]);
  });

  it('pins third-party actions to immutable commit SHAs', async () => {
    const workflows = await readWorkflowFiles();

    for (const workflow of workflows) {
      for (const actionUse of getActionUses(workflow.content)) {
        expect(actionUse, `${workflow.name} uses mutable action reference "${actionUse}"`).toMatch(
          pinnedExternalActionPattern
        );
      }
    }
  });
});
