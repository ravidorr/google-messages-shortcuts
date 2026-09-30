import { readFile } from 'node:fs/promises';
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
  'icons/icon128.png',
  'src/background/command-listener.js',
  'src/background/shortcut-label-listener.js',
  'src/popup/init-popup.js',
  'src/shared/commands.js'
];

function normalizeArchiveEntry(entryName) {
  return entryName.replace(/\\/g, '/').replace(/^\.\//, '');
}

export function getMissingPackageEntries(entries, requiredEntries = REQUIRED_PACKAGE_ENTRIES) {
  const normalizedEntries = new Set(entries.map(normalizeArchiveEntry));

  return requiredEntries.filter((entry) => !normalizedEntries.has(entry));
}

export async function validatePackageArtifact(archivePath) {
  const archiveBuffer = await readFile(archivePath);
  const archive = await JSZip.loadAsync(archiveBuffer);
  const entries = Object.keys(archive.files).filter((entry) => !archive.files[entry].dir);
  const missingEntries = getMissingPackageEntries(entries);

  if (missingEntries.length > 0) {
    throw new Error(`Package artifact is missing required entries: ${missingEntries.join(', ')}`);
  }

  const manifest = JSON.parse(await archive.file('manifest.json').async('string'));

  if (manifest.manifest_version !== 3) {
    throw new Error('Package artifact manifest must declare manifest_version 3.');
  }

  return {
    archivePath,
    entryCount: entries.length
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
