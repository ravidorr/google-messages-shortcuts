// @vitest-environment node

import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildExtension } from '../../scripts/build.js';

const temporaryDirectories = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.map((directory) => rm(directory, {
    force: true,
    recursive: true
  })));
});

describe('buildExtension', () => {
  it('copies extension assets and source files into a clean output directory', async () => {
    const sourceDirectory = await mkdtemp(path.join(tmpdir(), 'extension-source-'));
    const outputDirectory = path.join(sourceDirectory, 'dist');
    temporaryDirectories.push(sourceDirectory);

    await Promise.all([
      mkdir(path.join(sourceDirectory, 'icons')),
      mkdir(path.join(sourceDirectory, 'src', 'content'), { recursive: true }),
      mkdir(path.join(sourceDirectory, 'src', 'shared'), { recursive: true }),
      mkdir(outputDirectory)
    ]);
    await Promise.all([
      writeFile(path.join(sourceDirectory, 'background.js'), 'background'),
      writeFile(
        path.join(sourceDirectory, 'content.js'),
        "import { message } from './src/content/entry.js'; globalThis.contentMessage = message;"
      ),
      writeFile(path.join(sourceDirectory, 'manifest.json'), '{}'),
      writeFile(path.join(sourceDirectory, 'popup.css'), 'body {}'),
      writeFile(path.join(sourceDirectory, 'popup.html'), '<main></main>'),
      writeFile(path.join(sourceDirectory, 'popup.js'), 'popup'),
      writeFile(path.join(sourceDirectory, 'icons', 'icon.svg'), '<svg/>'),
      writeFile(path.join(sourceDirectory, 'src', 'content', 'entry.js'), "export const message = 'ready';"),
      writeFile(path.join(sourceDirectory, 'src', 'shared', 'commands.js'), 'commands')
    ]);
    await writeFile(path.join(outputDirectory, 'stale.txt'), 'stale');

    await buildExtension(sourceDirectory, outputDirectory);

    await expect(readFile(path.join(outputDirectory, 'background.js'), 'utf8')).resolves.toBe('background');
    await expect(readFile(path.join(outputDirectory, 'icons', 'icon.svg'), 'utf8')).resolves.toContain('<svg');
    await expect(readFile(path.join(outputDirectory, 'src', 'shared', 'commands.js'), 'utf8')).resolves.toBe('commands');
    await expect(readFile(path.join(outputDirectory, 'stale.txt'), 'utf8')).rejects.toThrow();
    await expect(readFile(path.join(outputDirectory, 'icons', 'icon16.png'))).resolves.toBeInstanceOf(Buffer);
    await expect(readFile(path.join(outputDirectory, 'content.js'), 'utf8')).resolves.not.toContain('import ');
  });
});
