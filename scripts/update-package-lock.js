import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export function npmCommandForPlatform(platform = process.platform) {
  return platform === 'win32' ? 'npm.cmd' : 'npm';
}

export function packageJsonIsStaged(command = execFileSync) {
  try {
    command('git', ['diff', '--cached', '--quiet', '--', 'package.json'], {
      stdio: 'ignore'
    });
    return false;
  } catch (error) {
    if (error.status === 1) {
      return true;
    }

    throw error;
  }
}

export function updatePackageLock(command = execFileSync) {
  if (!packageJsonIsStaged(command)) {
    return false;
  }

  command('git', ['add', '--', 'package.json'], { stdio: 'inherit' });
  command(npmCommandForPlatform(), ['install'], { stdio: 'inherit' });
  command('git', ['add', '--', 'package-lock.json'], { stdio: 'inherit' });
  return true;
}

export function runUpdatePackageLockCli(command = execFileSync) {
  return Promise.resolve().then(() => updatePackageLock(command)).catch((error) => {
    console.error('Failed to regenerate package-lock.json.', error);
    process.exitCode = 1;
  });
}

export const cliExecutionPromise = process.argv[1] === fileURLToPath(import.meta.url)
  ? runUpdatePackageLockCli()
  : undefined;
