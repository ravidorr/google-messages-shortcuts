// @vitest-environment node

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const consoleProbePath = fileURLToPath(
  new URL('../../output/live-validation-console.js', import.meta.url)
);

describe('live validation console', () => {
  it('is valid JavaScript that can be pasted into the DevTools console', async () => {
    const localThis = await readFile(consoleProbePath, 'utf8');

    expect(() => new Function(localThis)).not.toThrow();
  });

  it('delegates to the built-in page bridge validation API', async () => {
    const localThis = await readFile(consoleProbePath, 'utf8');

    expect(localThis).toContain('MS.runMarkAsReadLiveValidation()');
    expect(localThis).not.toContain('runConversationAction');
    expect(localThis).not.toContain('handleCommand');
    expect(localThis).not.toContain('runCapabilitySelfTest()');
  });

  it('documents destructive debug validation requirements', async () => {
    const localThis = await readFile(consoleProbePath, 'utf8');

    expect(localThis).toContain('enableMarkAsReadLiveValidation');
    expect(localThis).toContain('Destructive debug validation');
  });
});
