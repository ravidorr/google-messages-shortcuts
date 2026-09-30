// @vitest-environment node

import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterEach, describe, expect, it } from 'vitest';
import { generateIcons } from '../../scripts/generate-icons.js';

const temporaryDirectories = [];
const iconSizes = [16, 32, 48, 128];

afterEach(async () => {
  await Promise.all(temporaryDirectories.map((directory) => rm(directory, {
    force: true,
    recursive: true
  })));
});

describe('generateIcons', () => {
  it('writes PNG icons with the expected dimensions', async () => {
    const outputDirectory = await mkdtemp(path.join(tmpdir(), 'generated-icons-'));
    temporaryDirectories.push(outputDirectory);

    await generateIcons(outputDirectory);

    await Promise.all(iconSizes.map(async (size) => {
      const iconPath = path.join(outputDirectory, `icon${size}.png`);
      const iconHeader = await readFile(iconPath);
      const metadata = await sharp(iconPath).metadata();

      expect(iconHeader.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
      expect(metadata.format).toBe('png');
      expect(metadata.width).toBe(size);
      expect(metadata.height).toBe(size);
    }));
  });

  it('fails when the source icon is missing', async () => {
    const outputDirectory = await mkdtemp(path.join(tmpdir(), 'generated-icons-'));
    temporaryDirectories.push(outputDirectory);

    await expect(generateIcons(
      outputDirectory,
      path.join(outputDirectory, 'missing-source.png')
    )).rejects.toThrow();
  });
});
