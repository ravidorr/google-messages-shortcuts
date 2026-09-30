import { describe, expect, it } from 'vitest';
import {
  isVersionBumped,
  packageLockVersionMatches,
  validateVersionBump,
  versionsMatch
} from '../../scripts/validate-version-bump.js';

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

describe('validateVersionBump', () => {
  it('accepts synchronized package and manifest version bumps', () => {
    expect(validateVersionBump({
      basePackage: packageFile('1.0.0'),
      currentPackage: packageFile('1.0.1'),
      baseManifest: manifestFile('1.0'),
      currentManifest: manifestFile('1.0.1'),
      currentPackageLock: packageLockFile('1.0.1')
    })).toEqual({
      packageVersionBumped: true,
      manifestVersionBumped: true,
      packageLockVersionIsSynchronized: true,
      versionsAreSynchronized: true,
      valid: true
    });
  });

  it('rejects a pull request that does not bump both versions', () => {
    expect(validateVersionBump({
      basePackage: packageFile('1.0.0'),
      currentPackage: packageFile('1.0.1'),
      baseManifest: manifestFile('1.0'),
      currentManifest: manifestFile('1.0'),
      currentPackageLock: packageLockFile('1.0.1')
    }).valid).toBe(false);
  });

  it('rejects version files with different version values', () => {
    expect(versionsMatch('1.0.1', '1.0.2')).toBe(false);
    expect(versionsMatch('1.0.1', 'not-a-version')).toBe(false);
  });

  it('rejects malformed version bumps', () => {
    expect(isVersionBumped('1.0.0', '1.0.0')).toBe(false);
    expect(validateVersionBump({
      basePackage: packageFile('1.0.0'),
      currentPackage: 'not JSON',
      baseManifest: manifestFile('1.0.0'),
      currentManifest: manifestFile('1.0.1'),
      currentPackageLock: packageLockFile('1.0.1')
    }).valid).toBe(false);
  });

  it('rejects a version bump with stale package-lock metadata', () => {
    expect(validateVersionBump({
      basePackage: packageFile('1.0.0'),
      currentPackage: packageFile('1.0.1'),
      baseManifest: manifestFile('1.0.0'),
      currentManifest: manifestFile('1.0.1'),
      currentPackageLock: packageLockFile('1.0.0')
    }).valid).toBe(false);
  });

  it('requires both package-lock root version fields to match', () => {
    expect(packageLockVersionMatches('1.0.1', packageLockFile('1.0.1'))).toBe(true);
    expect(packageLockVersionMatches('1.0.1', packageLockFile('1.0.1', '1.0.0'))).toBe(false);
    expect(packageLockVersionMatches('1.0.1', '{"version":"1.0.1"}')).toBe(false);
    expect(packageLockVersionMatches('1.0.1', 'not JSON')).toBe(false);
  });
});
