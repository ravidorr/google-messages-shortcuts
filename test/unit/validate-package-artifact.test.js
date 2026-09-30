// @vitest-environment node

import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import JSZip from 'jszip';
import { afterEach, describe, expect, it } from 'vitest';
import {
  getMissingPackageEntries,
  REQUIRED_PACKAGE_ENTRIES,
  validatePackageArtifact
} from '../../scripts/validate-package-artifact.js';

const temporaryDirectories = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => import('node:fs/promises').then(({ rm }) => rm(directory, {
    force: true,
    recursive: true
  }))));
});

async function createArchive(projectDirectory, entries) {
  const archivePath = path.join(projectDirectory, 'google-messages-shortcuts.zip');
  const archive = new JSZip();

  for (const [entryName, contents] of Object.entries(entries)) {
    archive.file(entryName, contents);
  }

  await writeFile(archivePath, await archive.generateAsync({ type: 'nodebuffer' }));

  return archivePath;
}

describe('validate-package-artifact', () => {
  it('reports missing required package entries', () => {
    const localThis = {
      entries: ['background.js', 'manifest.json']
    };

    expect(getMissingPackageEntries(localThis.entries)).toEqual(
      REQUIRED_PACKAGE_ENTRIES.filter((entry) => !localThis.entries.includes(entry))
    );
  });

  it('accepts a package artifact with the required extension files', async () => {
    const projectDirectory = await mkdtemp(path.join(tmpdir(), 'package-artifact-'));
    temporaryDirectories.push(projectDirectory);

    const archivePath = await createArchive(projectDirectory, Object.fromEntries(
      REQUIRED_PACKAGE_ENTRIES.map((entry) => [entry, entry.endsWith('.json') ? '{"manifest_version":3}' : entry])
    ));

    await expect(validatePackageArtifact(archivePath)).resolves.toMatchObject({
      archivePath,
      entryCount: REQUIRED_PACKAGE_ENTRIES.length
    });
  });

  it('rejects package artifacts missing required extension files', async () => {
    const projectDirectory = await mkdtemp(path.join(tmpdir(), 'package-artifact-missing-'));
    temporaryDirectories.push(projectDirectory);
    await mkdir(path.join(projectDirectory, 'icons'), { recursive: true });

    const archivePath = await createArchive(projectDirectory, {
      'background.js': 'background',
      'manifest.json': '{"manifest_version":3}'
    });

    await expect(validatePackageArtifact(archivePath)).rejects.toThrow(
      'Package artifact is missing required entries:'
    );
  });

  it('rejects package artifacts whose manifest is not MV3', async () => {
    const projectDirectory = await mkdtemp(path.join(tmpdir(), 'package-artifact-manifest-'));
    temporaryDirectories.push(projectDirectory);

    const archivePath = await createArchive(projectDirectory, Object.fromEntries(
      REQUIRED_PACKAGE_ENTRIES.map((entry) => [
        entry,
        entry === 'manifest.json' ? '{"manifest_version":2}' : entry
      ])
    ));

    await expect(validatePackageArtifact(archivePath)).rejects.toThrow(
      'Package artifact manifest must declare manifest_version 3.'
    );
  });
});
