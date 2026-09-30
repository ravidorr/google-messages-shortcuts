import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
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
    await writeFile(path.join(distDirectory, 'manifest.json'), '{}');

    const archivePath = await packageExtension(distDirectory, releaseDirectory);
    const archiveHeader = await readFile(archivePath);

    expect(path.basename(archivePath)).toBe('google-messages-shortcuts.zip');
    expect(archiveHeader.subarray(0, 2).toString()).toBe('PK');
  });
});
