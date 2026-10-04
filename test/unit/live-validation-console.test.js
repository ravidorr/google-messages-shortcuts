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

  it('uses only the read-only page bridge self-test API', async () => {
    const localThis = await readFile(consoleProbePath, 'utf8');

    expect(localThis).toContain('MS.runCapabilitySelfTest()');
    expect(localThis).not.toContain('runConversationAction');
    expect(localThis).not.toContain('handleCommand');
  });

  it('validates mark-as-read through pill interactions on two unread rows', async () => {
    const localThis = await readFile(consoleProbePath, 'utf8');

    expect(localThis).toContain('secondRowPillResult');
    expect(localThis).toContain('markReadPill.click()');
    expect(localThis).toContain('secondRowMarkReadPill.click()');
    expect(localThis).toContain('insufficient-unread-rows');
  });
});
