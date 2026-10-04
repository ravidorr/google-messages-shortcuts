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

  it('performs read-only hover checks without automating pill actions', async () => {
    const localThis = await readFile(consoleProbePath, 'utf8');

    expect(localThis).toContain('secondRowHoverCheck');
    expect(localThis).toContain('markReadPillPresent');
    expect(localThis).toContain('urlUnchanged');
    expect(localThis).toContain('unreadMarkerPersists');
    expect(localThis).toContain('manualFollowUp');
    expect(localThis).not.toContain('.click(');
    expect(localThis).not.toContain('pillResult');
  });
});
