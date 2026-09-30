import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ICON_SIZES = [16, 32, 48, 128];

export async function generateIcons(
  outputDirectory = path.resolve('icons'),
  sourceIconPath = path.join(outputDirectory, 'icon-source.png')
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

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const outputDirectory = process.argv[2] ? path.resolve(process.argv[2]) : undefined;

  generateIcons(outputDirectory).catch((error) => {
    console.error('Failed to generate icons.', error);
    process.exit(1);
  });
}
