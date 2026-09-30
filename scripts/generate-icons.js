import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const ICON_SIZES = [16, 32, 48, 128];
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultSourceIconPath = path.join(repositoryRoot, 'icons', 'icon-source.png');

export async function generateIcons(
  outputDirectory = path.resolve('icons'),
  sourceIconPath = defaultSourceIconPath
) {
  await mkdir(outputDirectory, { recursive: true });

  for (const size of ICON_SIZES) {
    const outputPath = path.join(outputDirectory, `icon${size}.png`);

    await sharp(sourceIconPath)
      .resize(size, size, { fit: 'contain' })
      .png()
      .toFile(outputPath);
  }
}

function runCli() {
  const outputDirectory = process.argv[2] ? path.resolve(process.argv[2]) : undefined;

  return generateIcons(outputDirectory);
}

export const cliExecutionPromise = process.argv[1] === new URL(import.meta.url).pathname
  ? runCli().catch((error) => {
    console.error('Failed to generate icons.', error);
    process.exit(1);
  })
  : undefined;
