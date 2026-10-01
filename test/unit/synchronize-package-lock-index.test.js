import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import {
  packageJsonChangedInHead,
  runSynchronizePackageLockIndexCli,
  synchronizePackageLockIndex
} from '../../scripts/synchronize-package-lock-index.js';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

describe('synchronize-package-lock-index', () => {
  it('detects package.json changes in the committed revision', () => {
    const command = vi.fn(() => 'package.json\npackage-lock.json\n');

    expect(packageJsonChangedInHead(command)).toBe(true);
    expect(command).toHaveBeenCalledWith(
      'git',
      ['diff-tree', '--no-commit-id', '--name-only', '-r', 'HEAD'],
      { encoding: 'utf8' }
    );
  });

  it('stages the lockfile after commits that change package.json', () => {
    const command = vi.fn(() => 'package.json\n');

    expect(synchronizePackageLockIndex(command)).toBe(true);
    expect(command).toHaveBeenNthCalledWith(
      2,
      'git',
      ['add', '--', 'package-lock.json'],
      { stdio: 'inherit' }
    );
  });

  it('leaves the index untouched when package.json was not committed', () => {
    const command = vi.fn(() => 'manifest.json\n');

    expect(synchronizePackageLockIndex(command)).toBe(false);
    expect(command).toHaveBeenCalledTimes(1);
  });

  it('completes post-commit synchronization', async () => {
    const command = vi.fn(() => 'package.json\n');

    await expect(runSynchronizePackageLockIndexCli(command)).resolves.toBe(true);
  });

  it('reports post-commit synchronization failures', async () => {
    const error = new Error('Git is unavailable');
    const command = vi.fn(() => {
      throw error;
    });
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const originalExitCode = process.exitCode;

    try {
      await runSynchronizePackageLockIndexCli(command);

      expect(consoleError).toHaveBeenCalledWith(
        'Failed to synchronize package-lock.json with Git.',
        error
      );
      expect(process.exitCode).toBe(1);
    } finally {
      process.exitCode = originalExitCode;
      consoleError.mockRestore();
    }
  });

  it('runs after commits through the post-commit hook', async () => {
    const postCommitHook = await readFile(path.join(repositoryRoot, '.husky', 'post-commit'), 'utf8');

    expect(postCommitHook).toContain('node scripts/synchronize-package-lock-index.js');
  });
});
