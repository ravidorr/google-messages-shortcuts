import { rm } from 'node:fs/promises';
import path from 'node:path';

const GENERATED_DIRECTORIES = ['coverage', 'dist', 'release'];

export async function cleanProject(projectDirectory) {
  await Promise.all(GENERATED_DIRECTORIES.map((directory) => rm(
    path.join(projectDirectory, directory),
    { force: true, recursive: true }
  )));
}

function runCli() {
  return cleanProject(process.cwd());
}

export const cliExecutionPromise = process.argv[1] === new URL(import.meta.url).pathname
  ? runCli().catch((error) => {
    console.error('Failed to clean generated files.', error);
    process.exit(1);
  })
  : undefined;
