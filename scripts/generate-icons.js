import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ICON_SIZES = [16, 32, 48, 128];

function buildSvg(size) {
  const bubbleSize = Math.round(size * 0.58);
  const bubbleX = Math.round(size * 0.18);
  const bubbleY = Math.round(size * 0.16);
  const stroke = Math.max(1, Math.round(size * 0.05));

  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.18)}" fill="#174EA6"/>
  <rect x="${bubbleX}" y="${bubbleY}" width="${bubbleSize}" height="${bubbleSize}" rx="${Math.round(bubbleSize * 0.18)}" fill="#FFFFFF"/>
  <path d="M${bubbleX + Math.round(bubbleSize * 0.22)} ${bubbleY + Math.round(bubbleSize * 0.34)} H${bubbleX + Math.round(bubbleSize * 0.78)}" stroke="#174EA6" stroke-width="${stroke}" stroke-linecap="round"/>
  <path d="M${bubbleX + Math.round(bubbleSize * 0.22)} ${bubbleY + Math.round(bubbleSize * 0.5)} H${bubbleX + Math.round(bubbleSize * 0.62)}" stroke="#174EA6" stroke-width="${stroke}" stroke-linecap="round"/>
  <path d="M${bubbleX + Math.round(bubbleSize * 0.22)} ${bubbleY + Math.round(bubbleSize * 0.66)} H${bubbleX + Math.round(bubbleSize * 0.72)}" stroke="#174EA6" stroke-width="${stroke}" stroke-linecap="round"/>
  <path d="M${size - Math.round(size * 0.24)} ${size - Math.round(size * 0.24)} L${size - Math.round(size * 0.12)} ${size - Math.round(size * 0.12)}" stroke="#FFFFFF" stroke-width="${stroke}" stroke-linecap="round"/>
</svg>`;
}

export async function generateIcons(outputDirectory = path.resolve('icons')) {
  await mkdir(outputDirectory, { recursive: true });

  for (const size of ICON_SIZES) {
    const svg = buildSvg(size);
    const outputPath = path.join(outputDirectory, `icon${size}.png`);

    await sharp(Buffer.from(svg)).png().toFile(outputPath);
  }

  await writeFile(path.join(outputDirectory, 'icon.svg'), buildSvg(128));
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const outputDirectory = process.argv[2] ? path.resolve(process.argv[2]) : undefined;

  generateIcons(outputDirectory).catch((error) => {
    console.error('Failed to generate icons.', error);
    process.exit(1);
  });
}
