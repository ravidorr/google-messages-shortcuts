import { access, cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { build } from 'esbuild';
import { generateIcons } from './generate-icons.js';

async function fileExists(filePath) {
  try {
    await access(filePath);

    return true;
  } catch {
    return false;
  }
}

export const BUILD_PATHS = [
  'background.js',
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
  const bundledScripts = [
    {
      entryPoints: [path.join(sourceDirectory, 'content.js')],
      outfile: path.join(outputDirectory, 'content.js')
    }
  ];
  const pageWorldBridgeEntry = path.join(sourceDirectory, 'page-world-bridge-main.js');

  if (await fileExists(pageWorldBridgeEntry)) {
    bundledScripts.push({
      entryPoints: [pageWorldBridgeEntry],
      outfile: path.join(outputDirectory, 'page-world-bridge.js')
    });
  }

  await Promise.all(bundledScripts.map((script) => build({
    bundle: true,
    entryPoints: script.entryPoints,
    format: 'iife',
    outfile: script.outfile,
    platform: 'browser'
  })));
  await generateIcons(
    path.join(outputDirectory, 'icons'),
    path.join(sourceDirectory, 'icons', 'icon-source.png')
  );
}

function runCli() {
  const sourceDirectory = process.cwd();
  const outputDirectory = path.join(sourceDirectory, 'dist');

  return buildExtension(sourceDirectory, outputDirectory);
}

export const cliExecutionPromise = process.argv[1] === new URL(import.meta.url).pathname
  ? runCli().catch((error) => {
    console.error('Failed to build the extension.', error);
    process.exit(1);
  })
  : undefined;
