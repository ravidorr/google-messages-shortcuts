// @vitest-environment node

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const consoleProbePath = fileURLToPath(
  new URL('../../output/deferred-action-validation-console.js', import.meta.url)
);

describe('deferred action validation console', () => {
  it('includes a read-only Spam and Blocked discovery probe', async () => {
    const localThis = await readFile(consoleProbePath, 'utf8');

    expect(localThis).toContain('inspectGoogleMessagesDestination');
    expect(localThis).toContain("spam: ['spam']");
    expect(localThis).toContain("blocked: ['blocked']");
    expect(localThis).toContain('readOnly: true');
    expect(localThis).toContain('uniqueActiveDestinationControl');
    expect(localThis).toContain('uniqueDestinationHeading');
    expect(localThis).toContain('uniqueDestinationDialog');
  });

  it('does not automate navigation or change page focus', async () => {
    const localThis = await readFile(consoleProbePath, 'utf8');

    expect(localThis).not.toContain('.click(');
    expect(localThis).not.toContain('.focus(');
  });
});
