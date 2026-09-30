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
const packageLockFile = (version, rootPackageVersion = version) => JSON.stringify({
  version,
  packages: {
    '': {
      version: rootPackageVersion
    }
  }
});

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

  it('detects a new changelog bullet in an existing release entry', () => {
    expect(hasNewChangelogEntry(
      previousChangelog,
      `${previousChangelog}
- Updated release notes.
`
    )).toBe(true);
  });

  it('accepts version components that increase at different precision levels', () => {
    expect(isVersionBumped('1.0', '1.0.1')).toBe(true);
    expect(isVersionBumped('1.0.0', '1.1.0')).toBe(true);
    expect(isVersionBumped('1.1.0', '1.0.1')).toBe(false);
    expect(isVersionBumped('1.0.0', '1.0.0')).toBe(false);
    expect(isVersionBumped('invalid', '1.0.1')).toBe(false);
  });

  it('allows commits with a changelog entry and synchronized version bump', () => {
    expect(canCommit({
      previousChangelog,
      currentChangelog: `${previousChangelog}
## 1.0.1 - 2026-10-01
`,
      previousPackage: packageFile('1.0.0'),
      currentPackage: packageFile('1.0.1'),
      previousManifest: manifestFile('1.0.0'),
      currentManifest: manifestFile('1.0.1'),
      currentPackageLock: packageLockFile('1.0.1')
    })).toBe(true);
  });

  it('blocks changelog-only commits', () => {
    expect(canCommit({
      previousChangelog,
      currentChangelog: `${previousChangelog}
## 1.0.1 - 2026-10-01
`,
      previousPackage: packageFile('1.0.0'),
      currentPackage: packageFile('1.0.0'),
      previousManifest: manifestFile('1.0.0'),
      currentManifest: manifestFile('1.0.0'),
      currentPackageLock: packageLockFile('1.0.0')
    })).toBe(false);
  });

  it('blocks version bumps without a changelog entry', () => {
    expect(canCommit({
      previousChangelog,
      currentChangelog: previousChangelog,
      previousPackage: packageFile('1.0.0'),
      currentPackage: packageFile('1.0.1'),
      previousManifest: manifestFile('1.0.0'),
      currentManifest: manifestFile('1.0.1'),
      currentPackageLock: packageLockFile('1.0.1')
    })).toBe(false);
  });

  it('blocks version bumps with mismatched package and manifest versions', () => {
    expect(canCommit({
      previousChangelog,
      currentChangelog: `${previousChangelog}
## 1.0.2 - 2026-10-01
`,
      previousPackage: packageFile('1.0.0'),
      currentPackage: packageFile('1.0.2'),
      previousManifest: manifestFile('1.0.0'),
      currentManifest: manifestFile('1.0.1'),
      currentPackageLock: packageLockFile('1.0.2')
    })).toBe(false);
  });

  it('blocks version bumps with stale package-lock metadata', () => {
    expect(canCommit({
      previousChangelog,
      currentChangelog: `${previousChangelog}
## 1.0.1 - 2026-10-01
`,
      previousPackage: packageFile('1.0.0'),
      currentPackage: packageFile('1.0.1'),
      previousManifest: manifestFile('1.0.0'),
      currentManifest: manifestFile('1.0.1'),
      currentPackageLock: packageLockFile('1.0.0')
    })).toBe(false);
  });

  it('blocks version bumps with stale package-lock root package metadata', () => {
    expect(canCommit({
      previousChangelog,
      currentChangelog: `${previousChangelog}
## 1.0.1 - 2026-10-01
`,
      previousPackage: packageFile('1.0.0'),
      currentPackage: packageFile('1.0.1'),
      previousManifest: manifestFile('1.0.0'),
      currentManifest: manifestFile('1.0.1'),
      currentPackageLock: packageLockFile('1.0.1', '1.0.0')
    })).toBe(false);
  });

  it('blocks malformed release metadata', () => {
    expect(canCommit({
      previousChangelog,
      currentChangelog: `${previousChangelog}
## 1.0.1 - 2026-10-01
`,
      previousPackage: packageFile('1.0.0'),
      currentPackage: 'not JSON',
      previousManifest: manifestFile('1.0.0'),
      currentManifest: manifestFile('1.0.1'),
      currentPackageLock: packageLockFile('1.0.1')
    })).toBe(false);
    expect(canCommit({
      previousChangelog,
      currentChangelog: `${previousChangelog}
## 1.0.1 - 2026-10-01
`,
      previousPackage: packageFile('1.0.0'),
      currentPackage: packageFile('1.0.1'),
      previousManifest: manifestFile('1.0.0'),
      currentManifest: 'not JSON',
      currentPackageLock: packageLockFile('1.0.1')
    })).toBe(false);
  });
});
