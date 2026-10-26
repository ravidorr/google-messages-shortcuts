// @vitest-environment node

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

function readProjectFile(relativePath) {
  return readFile(fileURLToPath(new URL(`../../${relativePath}`, import.meta.url)), 'utf8');
}

describe('release documentation', () => {
  it('lists the package version at the top of the store version history', async () => {
    const { version } = JSON.parse(await readProjectFile('package.json'));
    const storeDoc = await readProjectFile('CHROMEWEBSTORE.md');
    const firstRow = storeDoc.match(/^\| (\d+\.\d+\.\d+) \|/m);

    expect(firstRow?.[1]).toBe(version);
  });

  it('does not hard-code release or store publication status that goes stale', async () => {
    const [securityPolicy, storeDoc] = await Promise.all([
      readProjectFile('SECURITY.md'),
      readProjectFile('CHROMEWEBSTORE.md')
    ]);

    for (const document of [securityPolicy, storeDoc]) {
      expect(document).not.toMatch(/unreleased/i);
      expect(document).not.toMatch(/currently distributes/i);
    }
  });

  it('groups github/codeql-action updates so init and analyze bump together', async () => {
    const dependabot = await readProjectFile('.github/dependabot.yml');

    expect(dependabot).toMatch(/groups:\s+codeql-action:\s+patterns:\s+- github\/codeql-action\*/);
  });
});
