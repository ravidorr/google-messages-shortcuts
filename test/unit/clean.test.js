import { access, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanProject } from '../../scripts/clean.js';

const temporaryDirectories = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.map((directory) => rm(directory, {
    force: true,
    recursive: true
  })));
});

describe('cleanProject', () => {
  it('removes generated output directories', async () => {
    const projectDirectory = await mkdtemp(path.join(tmpdir(), 'extension-project-'));
    temporaryDirectories.push(projectDirectory);

    await Promise.all(['coverage', 'dist', 'release'].map((directory) => mkdir(
      path.join(projectDirectory, directory)
    )));

    await cleanProject(projectDirectory);

    await expect(access(path.join(projectDirectory, 'coverage'))).rejects.toThrow();
    await expect(access(path.join(projectDirectory, 'dist'))).rejects.toThrow();
    await expect(access(path.join(projectDirectory, 'release'))).rejects.toThrow();
  });
});
