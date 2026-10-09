import { readFile, rm, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import {
  assertReleaseNotesPresent,
  assertTagMatchesPackageVersion,
  extractChangelogNotes,
  main,
  readCurrentManifest,
  readCurrentPackageJson,
  readChangedFiles,
  readPackageVersion,
  requiresRelease,
  runExtractReleaseNotes,
  runReleaseGate,
  runTagReleaseValidation,
  validateRelease
} from '../scripts/check-release.mjs';

afterEach(async () => {
  await rm('release-notes.md', { force: true });
});

describe('extractChangelogNotes', () => {
  it('extracts only the requested version notes', () => {
    const changelog = [
      '# Changelog',
      '',
      '## [1.2.0] - 2026-10-09',
      '',
      '- New feature',
      '',
      '## [1.1.0] - 2026-10-08',
      '',
      '- Previous feature'
    ].join('\n');

    expect(extractChangelogNotes(changelog, '1.2.0')).toContain('New feature');
    expect(extractChangelogNotes(changelog, '1.2.0')).not.toContain('Previous feature');
  });

  it('returns no notes when the version is absent', () => {
    expect(extractChangelogNotes('## [1.0.0]\n\n- Fix', '2.0.0')).toBe('');
  });
});

describe('validateRelease', () => {
  it('accepts an increased version with matching changelog notes', () => {
    expect(() => validateRelease('1.0.0', '1.0.1', '1.0.1', '## [1.0.1]\n\n- Fix')).not.toThrow();
  });

  it('rejects an unchanged version', () => {
    expect(() => validateRelease('1.0.0', '1.0.0', '1.0.0', '## [1.0.0]\n\n- Fix')).toThrow('package version must change');
  });

  it('rejects a changelog without the version section', () => {
    expect(() => validateRelease('1.0.0', '1.0.1', '1.0.1', '## [1.0.0]\n\n- Fix')).toThrow('CHANGELOG.md must contain a section for 1.0.1');
  });

  it('rejects a version that does not increase', () => {
    expect(() => validateRelease('1.0.1', '1.0.0', '1.0.0', '## [1.0.0]\n\n- Fix'))
      .toThrow('package version must increase');
  });

  it('rejects an empty changelog section', () => {
    expect(() => validateRelease('1.0.0', '1.0.1', '1.0.1', '## [1.0.1]\n\n## [1.0.0]\n\n- Previous'))
      .toThrow('section for 1.0.1 must not be empty');
  });

  it('rejects a manifest version that differs from the package version', () => {
    expect(() => validateRelease('1.0.0', '1.0.1', '1.0.0', '## [1.0.1]\n\n- Fix'))
      .toThrow('manifest version must match package version');
  });
});

describe('requiresRelease', () => {
  it('requires a release for source and release metadata changes', () => {
    expect(requiresRelease(['src/popup/view.js'])).toBe(true);
    expect(requiresRelease(['package.json'])).toBe(true);
    expect(requiresRelease(['tsconfig.json'])).toBe(true);
  });

  it('does not require a release for documentation and test-only changes', () => {
    expect(requiresRelease(['README.md', 'test/check-release.test.mjs'])).toBe(false);
  });
});

describe('release metadata validation', () => {
  it('reads package and manifest versions from the repository', () => {
    expect(readPackageVersion('HEAD')).toBe('1.14.21');
    expect(readCurrentPackageJson().version).toBe('1.14.21');
    expect(readCurrentManifest().version).toBe('1.14.21');
    expect(readChangedFiles('HEAD')).toEqual([]);
  });

  it('requires a matching tag', () => {
    expect(() => assertTagMatchesPackageVersion('v1.0.1', '1.0.1')).not.toThrow();
    expect(() => assertTagMatchesPackageVersion('1.0.1', '1.0.1')).not.toThrow();
    expect(() => assertTagMatchesPackageVersion('v1.0.0', '1.0.1')).toThrow('does not match');
  });

  it('requires non-empty release notes', () => {
    expect(() => assertReleaseNotesPresent('Release notes')).not.toThrow();
    expect(() => assertReleaseNotesPresent('  ')).toThrow('release notes must not be empty');
  });

  it('validates release gate inputs and skips irrelevant changes', () => {
    expect(() => runReleaseGate({})).toThrow('BASE_REF is required');
    expect(() => runReleaseGate({ baseRef: '0000000000000000000000000000000000000000' })).not.toThrow();
    expect(() => runReleaseGate({
      baseRef: 'main',
      readDiffFiles: () => ['README.md']
    })).not.toThrow();
  });

  it('validates a release with injected repository readers', () => {
    expect(() => runReleaseGate({
      baseRef: 'main',
      readBasePackageVersion: () => '1.0.0',
      readDiffFiles: () => ['src/popup.js'],
      readCurrentPackageJson: () => ({ version: '1.0.1' }),
      readCurrentManifest: () => ({ version: '1.0.1' }),
      readChangelog: () => '## [1.0.1]\n\n- Fix'
    })).not.toThrow();
  });

  it('uses the current changelog for a qualifying release', () => {
    expect(() => runReleaseGate({
      baseRef: 'main',
      readBasePackageVersion: () => '1.14.19',
      readDiffFiles: () => ['src/popup.js']
    })).not.toThrow();
  });

  it('uses Git readers for the current repository release gate', () => {
    expect(() => runReleaseGate({ baseRef: 'HEAD' })).not.toThrow();
  });

  it('extracts and validates release notes through CLI helpers', async () => {
    expect(() => runExtractReleaseNotes()).toThrow('release version is required');
    runExtractReleaseNotes('1.14.21');
    await expect(readFile('release-notes.md', 'utf8')).resolves.toContain('runMarkAsReadLiveValidation');

    expect(() => runTagReleaseValidation()).toThrow('tag name is required');
    await writeFile('release-notes.md', 'Baseline notes\n');
    expect(() => runTagReleaseValidation('v1.14.21')).not.toThrow();
  });

  it('routes command arguments to extraction, tagging, and release validation', async () => {
    main(['node', 'script', '--extract-release-notes', '1.14.21']);
    await expect(readFile('release-notes.md', 'utf8')).resolves.toContain('runMarkAsReadLiveValidation');

    await writeFile('release-notes.md', 'Baseline notes\n');
    expect(() => main(['node', 'script', '--tag', 'v1.14.21'])).not.toThrow();
    expect(() => main(['node', 'script'], '0000000000000000000000000000000000000000')).not.toThrow();
  });

  it('runs the CLI entrypoint when invoked directly', async () => {
    const originalArgv = process.argv;
    const originalBaseRef = process.env.BASE_REF;
    const scriptPath = `${process.cwd()}/scripts/check-release.mjs`;

    process.argv = ['node', scriptPath];
    process.env.BASE_REF = '0000000000000000000000000000000000000000';
    await import(`${pathToFileURL(scriptPath).href}?run=${Date.now()}`);
    process.argv = originalArgv;
    process.env.BASE_REF = originalBaseRef;
  });
});
