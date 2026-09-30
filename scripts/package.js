import { createWriteStream } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { finished } from 'node:stream/promises';
import { ZipArchive } from 'archiver';

export async function packageExtension(distDirectory, releaseDirectory) {
  const archivePath = path.join(releaseDirectory, 'google-messages-shortcuts.zip');
  await mkdir(releaseDirectory, { recursive: true });
  await rm(archivePath, { force: true });

  const output = createWriteStream(archivePath);
  const archive = new ZipArchive({ zlib: { level: 9 } });
  const archiveFinished = finished(output);

  archive.on('error', (error) => output.destroy(error));
  archive.pipe(output);
  archive.directory(distDirectory, false);
  await archive.finalize();
  await archiveFinished;

  return archivePath;
}

function runCli() {
  const projectDirectory = process.cwd();

  return packageExtension(
    path.join(projectDirectory, 'dist'),
    path.join(projectDirectory, 'release')
  );
}

export const cliExecutionPromise = process.argv[1] === new URL(import.meta.url).pathname
  ? runCli().catch((error) => {
    console.error('Failed to package the extension.', error);
    process.exit(1);
  })
  : undefined;
