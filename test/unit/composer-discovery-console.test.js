// @vitest-environment node

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const consoleProbePath = fileURLToPath(
  new URL('../../output/composer-discovery-console.js', import.meta.url)
);

describe('composer discovery console', () => {
  it('includes sanitized composer discovery probes', async () => {
    const localThis = await readFile(consoleProbePath, 'utf8');

    expect(localThis).toContain('composer-discovery-spike');
    expect(localThis).toContain('editorCandidates');
    expect(localThis).toContain('sendCandidates');
    expect(localThis).toContain('no send action occurs');
  });

  it('does not automate composer focus or send actions', async () => {
    const localThis = await readFile(consoleProbePath, 'utf8');

    expect(localThis).not.toContain('.click(');
    expect(localThis).not.toContain('.focus(');
  });
});
