import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const EXTENSION_VERSION_PLACEHOLDER = '__EXTENSION_VERSION__';

export function readExtensionVersion(projectDirectory) {
  const packageJson = JSON.parse(
    readFileSync(path.join(projectDirectory, 'package.json'), 'utf8')
  );

  return packageJson.version;
}

export function renderSiteIndexHtml(projectDirectory) {
  const siteIndexHtml = readFileSync(path.join(projectDirectory, 'site/index.html'), 'utf8');
  const version = readExtensionVersion(projectDirectory);

  return siteIndexHtml.replaceAll(EXTENSION_VERSION_PLACEHOLDER, version);
}

export function buildGithubPagesSite(
  projectDirectory,
  outputDirectory = path.join(projectDirectory, '_site')
) {
  rmSync(outputDirectory, { recursive: true, force: true });
  mkdirSync(path.join(outputDirectory, 'design-system'), { recursive: true });
  writeFileSync(path.join(outputDirectory, 'index.html'), renderSiteIndexHtml(projectDirectory));
  cpSync(path.join(projectDirectory, 'site/site.css'), path.join(outputDirectory, 'site.css'));
  cpSync(
    path.join(projectDirectory, 'design-system/tokens.css'),
    path.join(outputDirectory, 'design-system/tokens.css')
  );

  return outputDirectory;
}

export function main(argv = process.argv) {
  const projectDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const outputDirectory = path.resolve(projectDirectory, argv[2] ?? '_site');

  buildGithubPagesSite(projectDirectory, outputDirectory);
  process.stdout.write(`Built GitHub Pages site at ${outputDirectory}\n`);
}

export function runCliEntrypoint(processArgs = process.argv, moduleUrl = import.meta.url) {
  if (processArgs[1] === fileURLToPath(moduleUrl)) {
    main(processArgs);
  }
}

runCliEntrypoint();
