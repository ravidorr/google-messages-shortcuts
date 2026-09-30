import { describe, expect, it } from 'vitest';
import {
  packageLockIsSynchronized
} from '../../scripts/validate-package-lock-version.js';

const packageFile = (version) => JSON.stringify({ version });
const packageLockFile = (version, rootPackageVersion = version) => JSON.stringify({
  version,
  packages: {
    '': {
      version: rootPackageVersion
    }
  }
});

describe('validate-package-lock-version', () => {
  it('accepts matching package and lockfile versions', () => {
    expect(packageLockIsSynchronized(
      packageFile('1.0.3'),
      packageLockFile('1.0.3')
    )).toBe(true);
  });

  it('rejects mismatched or malformed version metadata', () => {
    expect(packageLockIsSynchronized(
      packageFile('1.0.3'),
      packageLockFile('1.0.2')
    )).toBe(false);
    expect(packageLockIsSynchronized('not JSON', packageLockFile('1.0.3'))).toBe(false);
  });
});
