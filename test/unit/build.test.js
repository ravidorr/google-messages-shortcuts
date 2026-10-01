// @vitest-environment node

import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterEach, describe, expect, it } from 'vitest';
import { buildExtension } from '../../scripts/build.js';

const temporaryDirectories = [];
const expectedIconMetadata = {
  16: 'icons/icon16.png',
  32: 'icons/icon32.png',
  48: 'icons/icon48.png',
  128: 'icons/icon128.png'
};

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
      writeFile(
        path.join(sourceDirectory, 'page-world-bridge-main.js'),
        'globalThis.MessagesShortcuts = { __pageBridgeInstalled: true };'
      ),
      writeFile(path.join(sourceDirectory, 'manifest.json'), JSON.stringify({
        action: {
          default_icon: expectedIconMetadata
        },
        icons: expectedIconMetadata
      })),
      writeFile(path.join(sourceDirectory, 'popup.css'), 'body {}'),
      writeFile(path.join(sourceDirectory, 'popup.html'), '<main></main>'),
      writeFile(path.join(sourceDirectory, 'popup.js'), 'popup'),
      writeFile(path.join(sourceDirectory, 'icons', 'icon.svg'), '<svg/>'),
      sharp({
        create: {
          background: '#ff0000',
          channels: 4,
          height: 128,
          width: 128
        }
      }).png().toFile(path.join(sourceDirectory, 'icons', 'icon-source.png')),
      writeFile(path.join(sourceDirectory, 'src', 'content', 'entry.js'), "export const message = 'ready';"),
      writeFile(path.join(sourceDirectory, 'src', 'shared', 'commands.js'), 'commands')
    ]);
    await writeFile(path.join(outputDirectory, 'stale.txt'), 'stale');

    await buildExtension(sourceDirectory, outputDirectory);

    await expect(readFile(path.join(outputDirectory, 'background.js'), 'utf8')).resolves.toBe('background');
    await expect(readFile(path.join(outputDirectory, 'icons', 'icon.svg'), 'utf8')).resolves.toContain('<svg');
    await expect(readFile(path.join(outputDirectory, 'src', 'shared', 'commands.js'), 'utf8')).resolves.toBe('commands');
    await expect(readFile(path.join(outputDirectory, 'stale.txt'), 'utf8')).rejects.toThrow();
    await expect(readFile(path.join(outputDirectory, 'content.js'), 'utf8')).resolves.not.toContain('import ');
    await expect(readFile(path.join(outputDirectory, 'page-world-bridge.js'), 'utf8')).resolves.toContain(
      '__pageBridgeInstalled'
    );

    const manifest = JSON.parse(await readFile(path.join(outputDirectory, 'manifest.json'), 'utf8'));
    expect(manifest.icons).toEqual(expectedIconMetadata);
    expect(manifest.action.default_icon).toEqual(expectedIconMetadata);

    await Promise.all(Object.keys(expectedIconMetadata).map(async (size) => {
      const iconPath = path.join(outputDirectory, expectedIconMetadata[size]);
      const metadata = await sharp(iconPath).metadata();

      expect(metadata.format).toBe('png');
      expect(metadata.width).toBe(Number(size));
      expect(metadata.height).toBe(Number(size));
    }));
  });

  it('skips page-world-bridge bundling when the entry file is absent', async () => {
    const sourceDirectory = await mkdtemp(path.join(tmpdir(), 'extension-source-no-bridge-'));
    const outputDirectory = path.join(sourceDirectory, 'dist');
    temporaryDirectories.push(sourceDirectory);

    await Promise.all([
      mkdir(path.join(sourceDirectory, 'icons')),
      mkdir(path.join(sourceDirectory, 'src', 'content'), { recursive: true }),
      mkdir(outputDirectory)
    ]);
    await Promise.all([
      writeFile(path.join(sourceDirectory, 'background.js'), 'background'),
      writeFile(path.join(sourceDirectory, 'content.js'), 'globalThis.contentMessage = "ready";'),
      writeFile(path.join(sourceDirectory, 'manifest.json'), JSON.stringify({ icons: expectedIconMetadata })),
      writeFile(path.join(sourceDirectory, 'popup.css'), 'body {}'),
      writeFile(path.join(sourceDirectory, 'popup.html'), '<main></main>'),
      writeFile(path.join(sourceDirectory, 'popup.js'), 'popup'),
      sharp({
        create: {
          background: '#ff0000',
          channels: 4,
          height: 128,
          width: 128
        }
      }).png().toFile(path.join(sourceDirectory, 'icons', 'icon-source.png'))
    ]);

    await buildExtension(sourceDirectory, outputDirectory);

    await expect(readFile(path.join(outputDirectory, 'page-world-bridge.js'), 'utf8')).rejects.toThrow();
  });
});
