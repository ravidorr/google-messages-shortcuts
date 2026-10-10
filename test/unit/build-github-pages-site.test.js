// @vitest-environment node

import { execFileSync } from 'node:child_process';
import { accessSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  buildGithubPagesSite,
  main,
  runCliEntrypoint
} from '../../scripts/build-github-pages-site.mjs';

const projectDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const scriptPath = path.join(projectDirectory, 'scripts/build-github-pages-site.mjs');
const scriptUrl = pathToFileURL(scriptPath);

describe('build-github-pages-site', () => {
  it('stages HTML, CSS, and design tokens for the site.css import', () => {
    const outputDirectory = mkdtempSync(path.join(tmpdir(), 'gms-pages-'));

    try {
      buildGithubPagesSite(projectDirectory, outputDirectory);

      expect(() => accessSync(path.join(outputDirectory, 'index.html'))).not.toThrow();
      expect(() => accessSync(path.join(outputDirectory, 'site.css'))).not.toThrow();
      expect(() => accessSync(path.join(outputDirectory, 'design-system/tokens.css'))).not.toThrow();
    } finally {
      rmSync(outputDirectory, { recursive: true, force: true });
    }
  });

  it('uses the default _site output directory when none is provided', () => {
    const defaultSite = path.join(projectDirectory, '_site');

    rmSync(defaultSite, { recursive: true, force: true });

    try {
      main(['node', scriptPath]);

      expect(() => accessSync(path.join(defaultSite, 'index.html'))).not.toThrow();
    } finally {
      rmSync(defaultSite, { recursive: true, force: true });
    }
  });

  it('runs the CLI helper with an explicit output directory', () => {
    const outputDirectory = mkdtempSync(path.join(tmpdir(), 'gms-pages-cli-'));

    try {
      main(['node', path.join(projectDirectory, 'scripts/build-github-pages-site.mjs'), outputDirectory]);

      expect(() => accessSync(path.join(outputDirectory, 'index.html'))).not.toThrow();
    } finally {
      rmSync(outputDirectory, { recursive: true, force: true });
    }
  });

  it('runs as a standalone script', () => {
    const outputDirectory = mkdtempSync(path.join(tmpdir(), 'gms-pages-script-'));

    try {
      execFileSync('node', [scriptPath, outputDirectory], { cwd: projectDirectory, encoding: 'utf8' });

      expect(() => accessSync(path.join(outputDirectory, 'design-system/tokens.css'))).not.toThrow();
    } finally {
      rmSync(outputDirectory, { recursive: true, force: true });
    }
  });

  it('runs main only when the CLI entrypoint matches the module path', () => {
    const outputDirectory = mkdtempSync(path.join(tmpdir(), 'gms-pages-entry-'));

    try {
      runCliEntrypoint(['node', '/tmp/other-script.mjs', outputDirectory], scriptUrl);
      expect(() => accessSync(path.join(outputDirectory, 'index.html'))).toThrow();

      runCliEntrypoint(['node', scriptPath, outputDirectory], scriptUrl);
      expect(() => accessSync(path.join(outputDirectory, 'index.html'))).not.toThrow();
    } finally {
      rmSync(outputDirectory, { recursive: true, force: true });
    }
  });
});
