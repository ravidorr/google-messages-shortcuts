import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export function packageJsonChangedInHead(command = execFileSync) {
  const changedFiles = command(
    'git',
    ['diff-tree', '--no-commit-id', '--name-only', '-r', 'HEAD'],
    { encoding: 'utf8' }
  );

  return changedFiles.split('\n').includes('package.json');
}

export function synchronizePackageLockIndex(command = execFileSync) {
  if (!packageJsonChangedInHead(command)) {
    return false;
  }

  command('git', ['add', '--', 'package-lock.json'], { stdio: 'inherit' });
  return true;
}

export function runSynchronizePackageLockIndexCli(command = execFileSync) {
  return Promise.resolve().then(() => synchronizePackageLockIndex(command)).catch((error) => {
    console.error('Failed to synchronize package-lock.json with Git.', error);
    process.exitCode = 1;
  });
}

export const cliExecutionPromise = process.argv[1] === fileURLToPath(import.meta.url)
  ? runSynchronizePackageLockIndexCli()
  : undefined;
