// @vitest-environment node

import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { generateIcons } from '../../scripts/generate-icons.js';

const temporaryDirectories = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.map((directory) => rm(directory, {
    force: true,
    recursive: true
  })));
});

describe('generateIcons', () => {
  it('uses the repository source icon when writing to an empty custom directory', async () => {
    const outputDirectory = await mkdtemp(path.join(tmpdir(), 'generated-icons-'));
    temporaryDirectories.push(outputDirectory);

    await generateIcons(outputDirectory);

    await expect(readFile(path.join(outputDirectory, 'icon16.png'))).resolves.toBeInstanceOf(Buffer);
    await expect(readFile(path.join(outputDirectory, 'icon32.png'))).resolves.toBeInstanceOf(Buffer);
    await expect(readFile(path.join(outputDirectory, 'icon48.png'))).resolves.toBeInstanceOf(Buffer);
    await expect(readFile(path.join(outputDirectory, 'icon128.png'))).resolves.toBeInstanceOf(Buffer);
  });
});
