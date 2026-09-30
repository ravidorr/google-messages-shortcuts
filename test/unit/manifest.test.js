// @vitest-environment node

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const manifestPath = fileURLToPath(new URL('../../manifest.json', import.meta.url));

describe('extension manifest', () => {
  it('requests permission to persist the trash confirmation preference', async () => {
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

    expect(manifest.permissions).toContain('storage');
  });
});
