import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from '@jest/globals';

const repoRoot = join(fileURLToPath(import.meta.url), '..', '..');
const scriptPath = join(repoRoot, 'scripts/check-release.mjs');

function withTempDir(run) {
  const root = mkdtempSync(join(tmpdir(), 'check-release-cli-'));

  try {
    return run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function writeReleaseFixture(root, { version, changelog, releaseNotes }) {
  writeFileSync(
    join(root, 'package.json'),
    `${JSON.stringify({ version }, null, 2)}\n`
  );
  writeFileSync(join(root, 'CHANGELOG.md'), changelog);
  writeFileSync(join(root, 'release-notes.md'), releaseNotes);
}

function runCheckReleaseCli(root, cliArgs) {
  try {
    execFileSync(process.execPath, [scriptPath, ...cliArgs], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });

    return { ok: true, stderr: '' };
  } catch (error) {
    const stderr =
      typeof error.stderr === 'string'
        ? error.stderr
        : (error.stderr?.toString() ?? String(error.message));

    return { ok: false, stderr };
  }
}

describe('check-release CLI --tag integration', () => {
  it('accepts a valid tagged release fixture', () => {
    const localThis = { result: undefined };

    localThis.result = withTempDir((root) => {
      writeReleaseFixture(root, {
        version: '0.1.2',
        changelog: '## [0.1.2] - 2026-10-09\n\n- Example release.\n',
        releaseNotes: '- Example release.\n'
      });

      return runCheckReleaseCli(root, ['--tag', 'v0.1.2']);
    });

    expect(localThis.result.ok).toBe(true);
  });

  it('rejects --tag when the tag argument is missing', () => {
    const localThis = { result: undefined };

    localThis.result = withTempDir((root) => {
      writeReleaseFixture(root, {
        version: '0.1.2',
        changelog: '## [0.1.2] - 2026-10-09\n\n- Example release.\n',
        releaseNotes: '- Example release.\n'
      });

      return runCheckReleaseCli(root, ['--tag']);
    });

    expect(localThis.result.ok).toBe(false);
    expect(localThis.result.stderr).toContain('tag name is required');
  });

  it('rejects a tag that does not match package.json', () => {
    const localThis = { result: undefined };

    localThis.result = withTempDir((root) => {
      writeReleaseFixture(root, {
        version: '0.1.2',
        changelog: '## [0.1.2] - 2026-10-09\n\n- Example release.\n',
        releaseNotes: '- Example release.\n'
      });

      return runCheckReleaseCli(root, ['--tag', 'v0.1.3']);
    });

    expect(localThis.result.ok).toBe(false);
    expect(localThis.result.stderr).toContain(
      'tag 0.1.3 does not match package.json version 0.1.2'
    );
  });

  it('rejects empty release-notes.md', () => {
    const localThis = { result: undefined };

    localThis.result = withTempDir((root) => {
      writeReleaseFixture(root, {
        version: '0.1.2',
        changelog: '## [0.1.2] - 2026-10-09\n\n- Example release.\n',
        releaseNotes: '   \n'
      });

      return runCheckReleaseCli(root, ['--tag', 'v0.1.2']);
    });

    expect(localThis.result.ok).toBe(false);
    expect(localThis.result.stderr).toContain(
      'release notes must not be empty'
    );
  });
});

describe('check-release CLI --extract-release-notes integration', () => {
  it('writes release-notes.md from the matching changelog section', () => {
    const localThis = { notes: undefined };

    withTempDir((root) => {
      writeReleaseFixture(root, {
        version: '0.1.3',
        changelog:
          '## [0.1.3] - 2026-10-09\n\n- Harden release gates.\n\n## [0.1.2] - 2026-10-09\n\n- Older release.\n',
        releaseNotes: ''
      });

      const localThisInner = {
        result: runCheckReleaseCli(root, ['--extract-release-notes', '0.1.3'])
      };

      expect(localThisInner.result.ok).toBe(true);
      localThis.notes = readFileSync(join(root, 'release-notes.md'), 'utf8');
    });

    expect(localThis.notes).toBe('\n- Harden release gates.\n');
  });
});
