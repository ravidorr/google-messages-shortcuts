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

  it('normalizes archive entry paths before comparing package entries', () => {
    const localThis = {
      entries: ['./background.js', 'icons\\icon16.png']
    };

    expect(getMissingPackageEntries(localThis.entries)).toEqual(
      REQUIRED_PACKAGE_ENTRIES.filter((entry) => entry !== 'background.js' && entry !== 'icons/icon16.png')
    );
  });

  it('rejects package artifacts missing required extension files', async () => {
    const projectDirectory = await mkdtemp(path.join(tmpdir(), 'package-artifact-required-'));
    const distDirectory = path.join(projectDirectory, 'dist');
    temporaryDirectories.push(projectDirectory);

    await Promise.all(REQUIRED_PACKAGE_ENTRIES.map(async (entry) => {
      const entryPath = path.join(distDirectory, entry);
      await mkdir(path.dirname(entryPath), { recursive: true });
      await writeFile(
        entryPath,
        entry.endsWith('.json') ? '{"manifest_version":3}' : entry
      );
    }));

    const archivePath = await createArchive(projectDirectory, {
      'manifest.json': '{"manifest_version":3}'
    });

    await expect(validatePackageArtifact(archivePath, distDirectory)).rejects.toThrow(
      'Package artifact is missing required entries:'
    );
  });

  it('accepts a package artifact that mirrors the built distribution tree', async () => {
    const projectDirectory = await mkdtemp(path.join(tmpdir(), 'package-artifact-'));
    const distDirectory = path.join(projectDirectory, 'dist');
    temporaryDirectories.push(projectDirectory);

    await mkdir(path.join(distDirectory, 'src/background'), { recursive: true });
    await Promise.all([
      ...REQUIRED_PACKAGE_ENTRIES.map(async (entry) => {
        const entryPath = path.join(distDirectory, entry);
        await mkdir(path.dirname(entryPath), { recursive: true });
        await writeFile(
          entryPath,
          entry.endsWith('.json') ? '{"manifest_version":3}' : entry
        );
      }),
      writeFile(path.join(distDirectory, 'src/background/command-listener.js'), 'listener'),
      writeFile(path.join(distDirectory, 'src/background/command-router.js'), 'router')
    ]);

    const archivePath = await createArchive(projectDirectory, {
      ...Object.fromEntries(REQUIRED_PACKAGE_ENTRIES.map((entry) => [
        entry,
        entry.endsWith('.json') ? '{"manifest_version":3}' : entry
      ])),
      'src/background/command-listener.js': 'listener',
      'src/background/command-router.js': 'router'
    });

    await expect(validatePackageArtifact(archivePath, distDirectory)).resolves.toMatchObject({
      archivePath,
      distFileCount: REQUIRED_PACKAGE_ENTRIES.length + 2
    });
  });

  it('rejects package artifacts missing built distribution files', async () => {
    const projectDirectory = await mkdtemp(path.join(tmpdir(), 'package-artifact-missing-'));
    const distDirectory = path.join(projectDirectory, 'dist');
    temporaryDirectories.push(projectDirectory);
    await mkdir(path.join(distDirectory, 'src/background'), { recursive: true });

    await Promise.all([
      ...REQUIRED_PACKAGE_ENTRIES.map(async (entry) => {
        const entryPath = path.join(distDirectory, entry);
        await mkdir(path.dirname(entryPath), { recursive: true });
        await writeFile(
          entryPath,
          entry.endsWith('.json') ? '{"manifest_version":3}' : entry
        );
      }),
      writeFile(path.join(distDirectory, 'src/background/command-listener.js'), 'listener')
    ]);

    const archivePath = await createArchive(projectDirectory, Object.fromEntries(
      REQUIRED_PACKAGE_ENTRIES.map((entry) => [
        entry,
        entry.endsWith('.json') ? '{"manifest_version":3}' : entry
      ])
    ));

    await expect(validatePackageArtifact(archivePath, distDirectory)).rejects.toThrow(
      'Package artifact is missing built distribution files:'
    );
  });

  it('rejects package artifacts whose manifest is not MV3', async () => {
    const projectDirectory = await mkdtemp(path.join(tmpdir(), 'package-artifact-manifest-'));
    const distDirectory = path.join(projectDirectory, 'dist');
    temporaryDirectories.push(projectDirectory);

    await Promise.all(REQUIRED_PACKAGE_ENTRIES.map(async (entry) => {
      const entryPath = path.join(distDirectory, entry);
      await mkdir(path.dirname(entryPath), { recursive: true });
      await writeFile(
        entryPath,
        entry === 'manifest.json' ? '{"manifest_version":2}' : entry
      );
    }));

    const archivePath = await createArchive(projectDirectory, Object.fromEntries(
      REQUIRED_PACKAGE_ENTRIES.map((entry) => [
        entry,
        entry === 'manifest.json' ? '{"manifest_version":2}' : entry
      ])
    ));

    await expect(validatePackageArtifact(archivePath, distDirectory)).rejects.toThrow(
      'Package artifact manifest must declare manifest_version 3.'
    );
  });
});
