import { describe, expect, it } from 'vitest';
import {
  validateVersionBump,
  versionsMatch
} from '../../scripts/validate-version-bump.js';

const packageFile = (version) => JSON.stringify({ version });
const manifestFile = (version) => JSON.stringify({ version });

describe('validateVersionBump', () => {
  it('accepts synchronized package and manifest version bumps', () => {
    expect(validateVersionBump({
      basePackage: packageFile('1.0.0'),
      currentPackage: packageFile('1.0.1'),
      baseManifest: manifestFile('1.0'),
      currentManifest: manifestFile('1.0.1')
    })).toEqual({
      packageVersionBumped: true,
      manifestVersionBumped: true,
      versionsAreSynchronized: true,
      valid: true
    });
  });

  it('rejects a pull request that does not bump both versions', () => {
    expect(validateVersionBump({
      basePackage: packageFile('1.0.0'),
      currentPackage: packageFile('1.0.1'),
      baseManifest: manifestFile('1.0'),
      currentManifest: manifestFile('1.0')
    }).valid).toBe(false);
  });

  it('rejects version files with different version values', () => {
    expect(versionsMatch('1.0.1', '1.0.2')).toBe(false);
  });
});
