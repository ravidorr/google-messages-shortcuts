import { describe, expect, it } from 'vitest';
import {
  canCommit,
  hasNewChangelogEntry,
  isVersionBumped
} from '../../scripts/validate-release-metadata.js';

const previousChangelog = `# Changelog

## 1.0.0 - 2026-09-30
`;

const packageFile = (version) => JSON.stringify({ version });
const manifestFile = (version) => JSON.stringify({ version });

describe('validate-release-metadata', () => {
  it('detects a new level-two changelog entry', () => {
    expect(hasNewChangelogEntry(
      previousChangelog,
      `${previousChangelog}
## 1.0.1 - 2026-10-01
`
    )).toBe(true);
  });

  it('does not treat edits to an existing entry as a new entry', () => {
    expect(hasNewChangelogEntry(
      previousChangelog,
      `${previousChangelog}
Updated release notes.
`
    )).toBe(false);
  });

  it('accepts version components that increase at different precision levels', () => {
    expect(isVersionBumped('1.0', '1.0.1')).toBe(true);
    expect(isVersionBumped('1.0.0', '1.1.0')).toBe(true);
    expect(isVersionBumped('1.1.0', '1.0.1')).toBe(false);
  });

  it('allows commits with a new changelog entry', () => {
    expect(canCommit({
      previousChangelog,
      currentChangelog: `${previousChangelog}
## Unreleased
`,
      previousPackage: packageFile('1.0.0'),
      currentPackage: packageFile('1.0.0'),
      previousManifest: manifestFile('1.0'),
      currentManifest: manifestFile('1.0')
    })).toBe(true);
  });

  it('allows commits when both version files are bumped', () => {
    expect(canCommit({
      previousChangelog,
      currentChangelog: previousChangelog,
      previousPackage: packageFile('1.0.0'),
      currentPackage: packageFile('1.0.1'),
      previousManifest: manifestFile('1.0'),
      currentManifest: manifestFile('1.0.1')
    })).toBe(true);
  });

  it('blocks commits without a changelog entry or both version bumps', () => {
    expect(canCommit({
      previousChangelog,
      currentChangelog: previousChangelog,
      previousPackage: packageFile('1.0.0'),
      currentPackage: packageFile('1.0.1'),
      previousManifest: manifestFile('1.0'),
      currentManifest: manifestFile('1.0')
    })).toBe(false);
  });
});
