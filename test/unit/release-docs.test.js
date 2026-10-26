// @vitest-environment node

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const VERSION_HISTORY_SECTION = /^## Version History\r?\n(?<content>[\s\S]*?)(?=^## |(?![\s\S]))/m;

function readProjectFile(relativePath) {
  return readFile(fileURLToPath(new URL(`../../${relativePath}`, import.meta.url)), 'utf8');
}

function getVersionHistory(storeDoc) {
  const section = VERSION_HISTORY_SECTION.exec(storeDoc);

  expect(section, 'CHROMEWEBSTORE.md needs a "## Version History" section').not.toBeNull();

  const lines = section.groups.content.split('\n');
  const header = lines.find((line) => line.startsWith('| Version '));
  const versions = [...section.groups.content.matchAll(/^\| (\d+\.\d+\.\d+) \|/gm)]
    .map((match) => match[1]);

  return { header, versions };
}

function compareVersions(left, right) {
  const leftParts = left.split('.').map(Number);
  const rightParts = right.split('.').map(Number);

  return leftParts.reduce((difference, part, index) => difference || part - rightParts[index], 0);
}

function matchesPattern(pattern, name) {
  return pattern.endsWith('*') ? name.startsWith(pattern.slice(0, -1)) : name === pattern;
}

function getGroupPatterns(ecosystem) {
  return Object.values(ecosystem.groups ?? {}).flatMap((group) => group.patterns ?? []);
}

describe('release documentation', () => {
  it('lists the package version first in the store version history', async () => {
    const { version } = JSON.parse(await readProjectFile('package.json'));
    const { versions } = getVersionHistory(await readProjectFile('CHROMEWEBSTORE.md'));

    expect(versions[0]).toBe(version);
  });

  it('keeps the store version history unique and newest first', async () => {
    const { versions } = getVersionHistory(await readProjectFile('CHROMEWEBSTORE.md'));

    for (let index = 1; index < versions.length; index += 1) {
      expect(
        compareVersions(versions[index - 1], versions[index]),
        `${versions[index - 1]} must be newer than ${versions[index]}`
      ).toBeGreaterThan(0);
    }
  });

  it('tracks versions only, because the store dashboard owns review status', async () => {
    const { header } = getVersionHistory(await readProjectFile('CHROMEWEBSTORE.md'));

    expect(header?.trim()).toBe('| Version | Date | Changes |');
  });

  it('does not hard-code release status that goes stale', async () => {
    const documents = await Promise.all(
      ['SECURITY.md', 'CHROMEWEBSTORE.md', 'ROADMAP.md'].map(readProjectFile)
    );

    for (const document of documents) {
      expect(document).not.toMatch(/unreleased|currently distributes|current release:\s*\d/i);
    }
  });

  it('puts the package version at the top of the changelog', async () => {
    const { version } = JSON.parse(await readProjectFile('package.json'));
    const changelog = await readProjectFile('CHANGELOG.md');

    expect(changelog.match(/^## \[(\d+\.\d+\.\d+)\]/m)?.[1]).toBe(version);
  });

  it('groups every github/codeql-action step so they update together', async () => {
    const dependabot = parse(await readProjectFile('.github/dependabot.yml'));
    const workflow = await readProjectFile('.github/workflows/codeql.yml');
    const actionsEcosystem = dependabot.updates.find(
      (update) => update['package-ecosystem'] === 'github-actions'
    );
    const npmEcosystem = dependabot.updates.find(
      (update) => update['package-ecosystem'] === 'npm'
    );
    const codeqlSteps = [...workflow.matchAll(/uses:\s*(github\/codeql-action\/[\w-]+)@/g)]
      .map((match) => match[1]);
    const patterns = getGroupPatterns(actionsEcosystem);

    expect(codeqlSteps.length).toBeGreaterThan(1);
    for (const step of codeqlSteps) {
      expect(patterns.some((pattern) => matchesPattern(pattern, step)), step).toBe(true);
    }
    expect(getGroupPatterns(npmEcosystem)).not.toContain('github/codeql-action*');
  });
});
