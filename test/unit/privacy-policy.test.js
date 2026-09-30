// @vitest-environment node

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const privacyPolicyPath = fileURLToPath(new URL('../../PRIVACY.md', import.meta.url));

describe('privacy policy', () => {
  it('documents local preference storage and supported shortcut actions', async () => {
    const privacyPolicy = await readFile(privacyPolicyPath, 'utf8');

    expect(privacyPolicy).toContain('archive, trash, or mark as unread');
    expect(privacyPolicy).toContain('`storage`');
    expect(privacyPolicy).toContain('`autoConfirmTrash`');
    expect(privacyPolicy).toContain('`openConversationOnFocus`');
    expect(privacyPolicy).toMatch(/not synced or transmitted/i);
  });
});
