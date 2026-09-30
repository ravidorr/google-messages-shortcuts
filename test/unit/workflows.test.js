// @vitest-environment node

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const workflowsDirectory = fileURLToPath(new URL('../../.github/workflows', import.meta.url));
const pinnedActionPattern = /^actions\/[^@\s]+@[0-9a-f]{40}(?:\s+#\s+v\d+(?:\.\d+)*)?$/;

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
  return [...content.matchAll(/^\s*- uses: (.+)$/gm)].map((match) => match[1]);
}

describe('GitHub workflow security', () => {
  it('pins third-party actions to immutable commit SHAs', async () => {
    const workflows = await readWorkflowFiles();

    for (const workflow of workflows) {
      for (const actionUse of getActionUses(workflow.content)) {
        expect(actionUse, `${workflow.name} uses mutable action reference "${actionUse}"`).toMatch(
          pinnedActionPattern
        );
      }
    }
  });
});
