import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import JSZip from 'jszip';

export const REQUIRED_PACKAGE_ENTRIES = [
  'background.js',
  'content.js',
  'manifest.json',
  'popup.css',
  'popup.html',
  'popup.js',
  'icons/icon16.png',
  'icons/icon32.png',
  'icons/icon48.png',
  'icons/icon128.png'
];

function normalizeArchiveEntry(entryName) {
  return entryName.replace(/\\/g, '/').replace(/^\.\//, '');
}

export function getMissingPackageEntries(entries, requiredEntries = REQUIRED_PACKAGE_ENTRIES) {
  const normalizedEntries = new Set(entries.map(normalizeArchiveEntry));

  return requiredEntries.filter((entry) => !normalizedEntries.has(entry));
}

async function collectRelativeFiles(directory, baseDirectory = directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return collectRelativeFiles(entryPath, baseDirectory);
    }

    return [path.relative(baseDirectory, entryPath).replace(/\\/g, '/')];
  }));

  return files.flat();
}

export async function validatePackageArtifact(archivePath, distDirectory = path.join(process.cwd(), 'dist')) {
  const archiveBuffer = await readFile(archivePath);
  const archive = await JSZip.loadAsync(archiveBuffer);
  const archiveEntries = Object.keys(archive.files).filter((entry) => !archive.files[entry].dir);
  const normalizedArchiveEntries = archiveEntries.map(normalizeArchiveEntry);
  const missingRequiredEntries = getMissingPackageEntries(normalizedArchiveEntries);

  if (missingRequiredEntries.length > 0) {
    throw new Error(`Package artifact is missing required entries: ${missingRequiredEntries.join(', ')}`);
  }

  const distFiles = await collectRelativeFiles(distDirectory);
  const missingDistFiles = getMissingPackageEntries(normalizedArchiveEntries, distFiles);

  if (missingDistFiles.length > 0) {
    throw new Error(`Package artifact is missing built distribution files: ${missingDistFiles.join(', ')}`);
  }

  const manifest = JSON.parse(await archive.file('manifest.json').async('string'));

  if (manifest.manifest_version !== 3) {
    throw new Error('Package artifact manifest must declare manifest_version 3.');
  }

  return {
    archivePath,
    entryCount: archiveEntries.length,
    distFileCount: distFiles.length
  };
}

function runCli() {
  const archivePath = path.join(process.cwd(), 'release', 'google-messages-shortcuts.zip');

  return validatePackageArtifact(archivePath);
}

export const cliExecutionPromise = process.argv[1] === new URL(import.meta.url).pathname
  ? runCli().catch((error) => {
    console.error('Failed to validate the package artifact.', error);
    process.exit(1);
  })
  : undefined;
