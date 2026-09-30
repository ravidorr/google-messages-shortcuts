import { readFileSync } from 'node:fs';
import { packageLockVersionMatches } from './validate-version-bump.js';

export function packageLockIsSynchronized(packageContent, packageLockContent) {
  try {
    const packageVersion = JSON.parse(packageContent).version;

    return packageLockVersionMatches(packageVersion, packageLockContent);
  } catch {
    return false;
  }
}

function validatePackageLockVersion() {
  const isSynchronized = packageLockIsSynchronized(
    readFileSync('package.json', 'utf8'),
    readFileSync('package-lock.json', 'utf8')
  );

  if (!isSynchronized) {
    console.error(
      'Commit blocked: package-lock.json versions must match package.json.'
    );
    process.exit(1);
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  validatePackageLockVersion();
}
