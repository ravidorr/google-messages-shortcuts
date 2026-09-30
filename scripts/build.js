import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { generateIcons } from './generate-icons.js';

export const BUILD_PATHS = [
  'background.js',
  'content.js',
  'icons',
  'manifest.json',
  'popup.css',
  'popup.html',
  'popup.js',
  'src'
];

export async function buildExtension(sourceDirectory, outputDirectory) {
  await rm(outputDirectory, { force: true, recursive: true });
  await mkdir(outputDirectory, { recursive: true });

  await Promise.all(BUILD_PATHS.map((buildPath) => cp(
    path.join(sourceDirectory, buildPath),
    path.join(outputDirectory, buildPath),
    { recursive: true }
  )));
  await generateIcons(path.join(outputDirectory, 'icons'));
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const sourceDirectory = process.cwd();
  const outputDirectory = path.join(sourceDirectory, 'dist');

  buildExtension(sourceDirectory, outputDirectory).catch((error) => {
    console.error('Failed to build the extension.', error);
    process.exit(1);
  });
}
