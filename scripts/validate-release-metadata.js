import { execFileSync } from 'node:child_process';
import {
  packageLockVersionMatches,
  versionsMatch
} from './validate-version-bump.js';

function getVersion(content) {
  try {
    return JSON.parse(content).version;
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

export function hasNewChangelogEntry(previousChangelog, currentChangelog) {
  const getEntries = (changelog) => new Set(
    changelog
      .split('\n')
      .map((line) => line.match(/^(?:##|-)\s+(.+?)\s*$/)?.[1])
      .filter(Boolean)
  );
  const previousEntries = getEntries(previousChangelog);

  return [...getEntries(currentChangelog)].some((entry) => !previousEntries.has(entry));
}

export function canCommit({
  previousChangelog,
  currentChangelog,
  previousPackage,
  currentPackage,
  previousManifest,
  currentManifest,
  currentPackageLock
}) {
  const currentPackageVersion = getVersion(currentPackage);
  const currentManifestVersion = getVersion(currentManifest);
  const hasChangelogEntry = hasNewChangelogEntry(previousChangelog, currentChangelog);
  const packageVersionBumped = isVersionBumped(
    getVersion(previousPackage),
    currentPackageVersion
  );
  const manifestVersionBumped = isVersionBumped(
    getVersion(previousManifest),
    currentManifestVersion
  );
  const versionsAreSynchronized = versionsMatch(currentPackageVersion, currentManifestVersion);
  const packageLockVersionIsSynchronized = packageLockVersionMatches(
    currentPackageVersion,
    currentPackageLock
  );

  return hasChangelogEntry
    && packageVersionBumped
    && manifestVersionBumped
    && versionsAreSynchronized
    && packageLockVersionIsSynchronized;
}

function readGitFile(revision, filePath) {
  try {
    return execFileSync('git', ['show', `${revision}:${filePath}`], { encoding: 'utf8' });
  } catch {
    return '';
  }
}

function getBaseRevision(baseRevision = process.argv[2]) {
  if (baseRevision) {
    return baseRevision;
  }

  try {
    return execFileSync('git', ['merge-base', 'HEAD', 'origin/main'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
  } catch {
    return 'HEAD';
  }
}

function validateReleaseMetadata() {
  const baseRevision = getBaseRevision();
  const canCommitChanges = canCommit({
    previousChangelog: readGitFile(baseRevision, 'CHANGELOG.md'),
    currentChangelog: readGitFile('', 'CHANGELOG.md'),
    previousPackage: readGitFile(baseRevision, 'package.json'),
    currentPackage: readGitFile('', 'package.json'),
    previousManifest: readGitFile(baseRevision, 'manifest.json'),
    currentManifest: readGitFile('', 'manifest.json'),
    currentPackageLock: readGitFile('', 'package-lock.json')
  });

  if (!canCommitChanges) {
    console.error(
      'Commit blocked: add a new CHANGELOG.md entry, bump package.json and manifest.json, and keep package-lock.json synchronized.'
    );
    process.exit(1);
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  validateReleaseMetadata();
}
