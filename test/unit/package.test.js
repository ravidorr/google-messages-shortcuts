import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import JSZip from 'jszip';
import { afterEach, describe, expect, it } from 'vitest';
import { packageExtension } from '../../scripts/package.js';

const temporaryDirectories = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.map((directory) => rm(directory, {
    force: true,
    recursive: true
  })));
});

describe('packageExtension', () => {
  it('creates a ZIP archive from the distribution directory', async () => {
    const projectDirectory = await mkdtemp(path.join(tmpdir(), 'extension-package-'));
    const distDirectory = path.join(projectDirectory, 'dist');
    const releaseDirectory = path.join(projectDirectory, 'release');
    temporaryDirectories.push(projectDirectory);

    await mkdir(distDirectory);
    await mkdir(path.join(distDirectory, 'icons'));
    await writeFile(path.join(distDirectory, 'background.js'), 'background');
    await writeFile(path.join(distDirectory, 'manifest.json'), '{"name":"Messages Shortcut Actions"}');
    await writeFile(path.join(distDirectory, 'icons', 'icon16.png'), 'icon');

    const archivePath = await packageExtension(distDirectory, releaseDirectory);
    const archiveHeader = await readFile(archivePath);
    const archive = await JSZip.loadAsync(archiveHeader);
    const entries = Object.keys(archive.files).sort();

    expect(path.basename(archivePath)).toBe('google-messages-shortcuts.zip');
    expect(archiveHeader.subarray(0, 2).toString()).toBe('PK');
    expect(entries).toEqual([
      'background.js',
      'icons/',
      'icons/icon16.png',
      'manifest.json'
    ]);
    expect(entries.every((entry) => !entry.startsWith('dist/'))).toBe(true);
    await expect(archive.file('manifest.json').async('string')).resolves.toBe(
      '{"name":"Messages Shortcut Actions"}'
    );
    await expect(archive.file('background.js').async('string')).resolves.toBe('background');
    await expect(archive.file('icons/icon16.png').async('string')).resolves.toBe('icon');
  });
});
