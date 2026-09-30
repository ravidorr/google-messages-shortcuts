import { rm } from 'node:fs/promises';
import path from 'node:path';

const GENERATED_DIRECTORIES = ['coverage', 'dist', 'release'];

export async function cleanProject(projectDirectory) {
  await Promise.all(GENERATED_DIRECTORIES.map((directory) => rm(
    path.join(projectDirectory, directory),
    { force: true, recursive: true }
  )));
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  cleanProject(process.cwd()).catch((error) => {
    console.error('Failed to clean generated files.', error);
    process.exit(1);
  });
}
