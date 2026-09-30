import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

function getVersion(fileContent) {
  try {
    return JSON.parse(fileContent).version;
  } catch {
    return undefined;
  }
}

function getVersionParts(version) {
  if (typeof version !== 'string' || !/^\d+(?:\.\d+)*$/.test(version)) {
    return undefined;
  }

  return version.split('.').map(Number);
}

export function versionsMatch(packageVersion, manifestVersion) {
  const packageParts = getVersionParts(packageVersion);
  const manifestParts = getVersionParts(manifestVersion);

  if (!packageParts || !manifestParts) {
    return false;
  }

  const partCount = Math.max(packageParts.length, manifestParts.length);

  return Array.from({ length: partCount }).every((_, index) => (
    (packageParts[index] ?? 0) === (manifestParts[index] ?? 0)
  ));
}

export function isVersionBumped(previousVersion, currentVersion) {
  const previousParts = getVersionParts(previousVersion);
  const currentParts = getVersionParts(currentVersion);

  if (!previousParts || !currentParts) {
    return false;
  }

  const partCount = Math.max(previousParts.length, currentParts.length);

  for (let index = 0; index < partCount; index += 1) {
    const previousPart = previousParts[index] ?? 0;
    const currentPart = currentParts[index] ?? 0;

    if (currentPart !== previousPart) {
      return currentPart > previousPart;
    }
  }

  return false;
}

export function validateVersionBump({
  basePackage,
  currentPackage,
  baseManifest,
  currentManifest
}) {
  const basePackageVersion = getVersion(basePackage);
  const currentPackageVersion = getVersion(currentPackage);
  const baseManifestVersion = getVersion(baseManifest);
  const currentManifestVersion = getVersion(currentManifest);
  const packageVersionBumped = isVersionBumped(basePackageVersion, currentPackageVersion);
  const manifestVersionBumped = isVersionBumped(baseManifestVersion, currentManifestVersion);
  const versionsAreSynchronized = versionsMatch(currentPackageVersion, currentManifestVersion);

  return {
    packageVersionBumped,
    manifestVersionBumped,
    valid: packageVersionBumped && manifestVersionBumped && versionsAreSynchronized,
    versionsAreSynchronized
  };
}

function readGitFile(revision, filePath) {
  return execFileSync('git', ['show', `${revision}:${filePath}`], { encoding: 'utf8' });
}

async function validateCurrentBranch() {
  const baseRevision = process.argv[2];

  if (!baseRevision) {
    throw new Error('Pass the base revision, for example: origin/main.');
  }

  const result = validateVersionBump({
    basePackage: readGitFile(baseRevision, 'package.json'),
    currentPackage: await readFile('package.json', 'utf8'),
    baseManifest: readGitFile(baseRevision, 'manifest.json'),
    currentManifest: await readFile('manifest.json', 'utf8')
  });

  if (!result.valid) {
    throw new Error(
      'Both package.json and manifest.json versions must increase and remain synchronized.'
    );
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  validateCurrentBranch().catch((error) => {
    console.error('Version bump validation failed.', error.message);
    process.exit(1);
  });
}
