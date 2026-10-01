import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import {
  npmCommandForPlatform,
  packageJsonIsStaged,
  runUpdatePackageLockCli,
  updatePackageLock
} from '../../scripts/update-package-lock.js';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const changedPackageJsonError = Object.assign(new Error('package.json has staged changes'), {
  status: 1
});

describe('update-package-lock', () => {
  it('uses the Windows npm shim on Windows', () => {
    expect(npmCommandForPlatform('win32')).toBe('npm.cmd');
    expect(npmCommandForPlatform('darwin')).toBe('npm');
  });

  it('detects whether package.json has staged changes', () => {
    const unchangedCommand = vi.fn();
    const changedCommand = vi.fn(() => {
      throw changedPackageJsonError;
    });

    expect(packageJsonIsStaged(unchangedCommand)).toBe(false);
    expect(packageJsonIsStaged(changedCommand)).toBe(true);
    expect(changedCommand).toHaveBeenCalledWith(
      'git',
      ['diff', '--cached', '--quiet', '--', 'package.json'],
      { stdio: 'ignore' }
    );
  });

  it('propagates unexpected Git errors', () => {
    const command = vi.fn(() => {
      throw Object.assign(new Error('Git is unavailable'), { status: 128 });
    });

    expect(() => packageJsonIsStaged(command)).toThrow('Git is unavailable');
  });

  it('stages package metadata and regenerates the lockfile when package.json is staged', () => {
    const command = vi.fn()
      .mockImplementationOnce(() => {
        throw changedPackageJsonError;
      });

    expect(updatePackageLock(command)).toBe(true);
    expect(command).toHaveBeenNthCalledWith(
      2,
      'git',
      ['add', '--', 'package.json'],
      { stdio: 'inherit' }
    );
    expect(command).toHaveBeenNthCalledWith(
      3,
      'npm',
      ['install'],
      { stdio: 'inherit' }
    );
    expect(command).toHaveBeenNthCalledWith(
      4,
      'git',
      ['add', '--', 'package-lock.json'],
      { stdio: 'inherit' }
    );
  });

  it('leaves the lockfile untouched when package.json is not staged', () => {
    const command = vi.fn();

    expect(updatePackageLock(command)).toBe(false);
    expect(command).toHaveBeenCalledTimes(1);
  });

  it('completes the CLI when package.json is unchanged', async () => {
    const command = vi.fn();

    await expect(runUpdatePackageLockCli(command)).resolves.toBe(false);
  });

  it('reports lockfile regeneration failures from the CLI', async () => {
    const error = new Error('npm is unavailable');
    const command = vi.fn(() => {
      throw error;
    });
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const originalExitCode = process.exitCode;

    try {
      await runUpdatePackageLockCli(command);

      expect(consoleError).toHaveBeenCalledWith('Failed to regenerate package-lock.json.', error);
      expect(process.exitCode).toBe(1);
    } finally {
      process.exitCode = originalExitCode;
      consoleError.mockRestore();
    }
  });

  it('runs before package-lock validation in the pre-commit hook', async () => {
    const preCommitHook = await readFile(path.join(repositoryRoot, '.husky', 'pre-commit'), 'utf8');

    expect(preCommitHook.indexOf('node scripts/update-package-lock.js'))
      .toBeLessThan(preCommitHook.indexOf('node scripts/validate-package-lock-version.js'));
  });
});
