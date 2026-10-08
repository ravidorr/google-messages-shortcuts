// @vitest-environment node

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import {
  validateSecurityPolicyFiles,
  validateSecurityPolicyVersion
} from '../../scripts/validate-security-policy-version.mjs';

const supportedStatus = String.fromCodePoint(0x2713);
const policyFor = (version, status = supportedStatus) => `## Supported Versions

| Version | Supported |
| ------- | --------- |
| ${version} | ${status} |
| Earlier releases | ✘ |
`;

describe('validateSecurityPolicyVersion', () => {
  it('accepts the exact package version', () => {
    expect(validateSecurityPolicyVersion('{"version":"1.2.3"}', policyFor('1.2.3'))).toEqual({
      valid: true,
      version: '1.2.3'
    });
  });

  it('rejects policies that support more than one release', () => {
    const policy = `## Supported Versions

| Version | Supported |
| ------- | --------- |
| 1.2.3 | ${supportedStatus} |
| 1.2.2 | ${supportedStatus} |
`;

    expect(validateSecurityPolicyVersion('{"version":"1.2.3"}', policy)).toEqual({
      valid: false,
      error: 'SECURITY.md must support only the package version.'
    });
  });

  it('accepts SemVer build metadata when the policy matches exactly', () => {
    const version = '1.2.3+build.4';

    expect(validateSecurityPolicyVersion(`{"version":"${version}"}`, policyFor(version))).toEqual({
      valid: true,
      version
    });
  });

  it.each([
    'not JSON',
    '{}',
    '{"version":1}',
    '{"version":"01.2.3"}',
    '{"version":"1.2.3-beta.1"}',
    '{"version":"1.2.3+build..4"}'
  ])('rejects invalid stable package versions: %s', (packageJson) => {
    expect(validateSecurityPolicyVersion(packageJson, policyFor('1.2.3'))).toEqual({
      valid: false,
      error: 'package.json must contain an exact stable SemVer version.'
    });
  });

  it('rejects a supported version that differs from package.json', () => {
    expect(validateSecurityPolicyVersion('{"version":"1.2.3"}', policyFor('1.2.2'))).toEqual({
      valid: false,
      error: 'SECURITY.md supports 1.2.2, but package.json declares 1.2.3. Update SECURITY.md.'
    });
  });

  it('rejects the package version when its policy row is unsupported', () => {
    expect(validateSecurityPolicyVersion('{"version":"1.2.3"}', policyFor('1.2.3', '✘'))).toEqual({
      valid: false,
      error: 'SECURITY.md declares 1.2.3 as unsupported. Mark the package version as supported.'
    });
  });

  it('rejects policies without an enabled supported version', () => {
    expect(validateSecurityPolicyVersion('{"version":"1.2.3"}', policyFor('1.2.2', '✘'))).toEqual({
      valid: false,
      error: 'SECURITY.md has no enabled supported-version row.'
    });
  });

  it('uses only the table in the Supported Versions section', () => {
    const policy = `## Example

| Version | Supported |
| ------- | --------- |
| 1.2.2 | ${supportedStatus} |

${policyFor('1.2.3')}`;

    expect(validateSecurityPolicyVersion('{"version":"1.2.3"}', policy)).toEqual({
      valid: true,
      version: '1.2.3'
    });
  });

  it('rejects a malformed supported-versions table', () => {
    const policy = `## Supported Versions

| Version | Supported |
This is not a table delimiter.
| 1.2.3 | ${supportedStatus} |`;

    expect(validateSecurityPolicyVersion('{"version":"1.2.3"}', policy).error).toBe(
      'SECURITY.md is missing a supported-versions table.'
    );
  });
});

describe('validateSecurityPolicyFiles', () => {
  it('reads package and policy files', () => {
    const directory = mkdtempSync(join(tmpdir(), 'security-policy-'));

    try {
      const packageJsonPath = join(directory, 'package.json');
      const policyPath = join(directory, 'SECURITY.md');
      writeFileSync(packageJsonPath, '{"version":"1.2.3"}');
      writeFileSync(policyPath, policyFor('1.2.3'));

      expect(validateSecurityPolicyFiles(packageJsonPath, policyPath)).toEqual({
        valid: true,
        version: '1.2.3'
      });
    } finally {
      rmSync(directory, { force: true, recursive: true });
    }
  });

  it('returns an actionable error when the policy file cannot be read', () => {
    const directory = mkdtempSync(join(tmpdir(), 'security-policy-'));

    try {
      const packageJsonPath = join(directory, 'package.json');
      writeFileSync(packageJsonPath, '{"version":"1.2.3"}');

      expect(validateSecurityPolicyFiles(packageJsonPath, join(directory, 'missing.md'))).toMatchObject({
        valid: false,
        error: expect.stringContaining('Unable to read security policy files:')
      });
    } finally {
      rmSync(directory, { force: true, recursive: true });
    }
  });

  it('stringifies non-Error file read failures', async () => {
    vi.doMock('node:fs', () => ({
      readFileSync: () => {
        throw 'filesystem unavailable';
      }
    }));

    try {
      vi.resetModules();
      const { validateSecurityPolicyFiles: readPolicyFiles } = await import(
        '../../scripts/validate-security-policy-version.mjs?non-error-read'
      );

      expect(readPolicyFiles()).toEqual({
        valid: false,
        error: 'Unable to read security policy files: filesystem unavailable'
      });
    } finally {
      vi.doUnmock('node:fs');
      vi.resetModules();
    }
  });
});
