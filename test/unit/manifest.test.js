// @vitest-environment node

import { access, readFile } from 'node:fs/promises';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { buildExtension } from '../../scripts/build.js';
import {
  COMMAND_ARCHIVE,
  COMMAND_MARK_UNREAD,
  COMMAND_TRASH
} from '../../src/shared/commands.js';

const projectDirectory = fileURLToPath(new URL('../..', import.meta.url));
const manifestPath = path.join(projectDirectory, 'manifest.json');
const temporaryDirectories = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, {
    force: true,
    recursive: true
  })));
});

async function expectFileExists(filePath) {
  await expect(access(filePath)).resolves.toBeUndefined();
}

describe('extension manifest', () => {
  it('declares the expected Manifest V3 contract', async () => {
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

    expect(manifest.manifest_version).toBe(3);
    expect(manifest.background).toEqual({
      service_worker: 'background.js',
      type: 'module'
    });
    expect(manifest.permissions).toEqual(['storage', 'tabs']);
    expect(manifest.host_permissions).toBeUndefined();
    expect(manifest.content_scripts).toEqual([
      {
        matches: ['https://messages.google.com/web/*'],
        js: ['page-world-bridge.js'],
        run_at: 'document_idle',
        world: 'MAIN'
      },
      {
        matches: ['https://messages.google.com/web/*'],
        js: ['content.js'],
        run_at: 'document_idle'
      }
    ]);
    expect(Object.keys(manifest.commands)).toEqual([
      COMMAND_ARCHIVE,
      COMMAND_TRASH,
      COMMAND_MARK_UNREAD
    ]);
    expect(manifest.icons).toEqual({
      16: 'icons/icon16.png',
      32: 'icons/icon32.png',
      48: 'icons/icon48.png',
      128: 'icons/icon128.png'
    });
    expect(manifest.action.default_icon).toEqual(manifest.icons);
  });

  it('builds manifest-referenced entrypoints and icons', async () => {
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    const outputDirectory = await mkdtemp(path.join(tmpdir(), 'manifest-build-'));
    temporaryDirectories.push(outputDirectory);

    await buildExtension(projectDirectory, outputDirectory);

    await expectFileExists(path.join(outputDirectory, manifest.background.service_worker));
    await expectFileExists(path.join(outputDirectory, manifest.content_scripts[0].js[0]));
    await expectFileExists(path.join(outputDirectory, manifest.content_scripts[1].js[0]));
    await expectFileExists(path.join(outputDirectory, manifest.action.default_popup));

    for (const iconPath of Object.values(manifest.icons)) {
      await expectFileExists(path.join(outputDirectory, iconPath));
    }
  });
});
