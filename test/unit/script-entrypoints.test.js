// @vitest-environment node

import { execFile } from 'node:child_process';
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import JSZip from 'jszip';
import sharp from 'sharp';
import { afterEach, describe, expect, it, vi } from 'vitest';

const execFileAsync = promisify(execFile);
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const temporaryDirectories = [];
let entrypointImportCount = 0;
const previousChangelog = `# Changelog

## 1.0.0 - 2026-09-30
`;

function scriptPath(scriptName) {
  return path.join(repositoryRoot, 'scripts', scriptName);
}

function packageFile(version) {
  return JSON.stringify({ version });
}

function manifestFile(version) {
  return JSON.stringify({ version });
}

function packageLockFile(version, rootPackageVersion = version) {
  return JSON.stringify({
    version,
    packages: {
      '': {
        version: rootPackageVersion
      }
    }
  });
}

function gitSafeEnvironment() {
  return Object.fromEntries(
    Object.entries(process.env).filter(([name]) => !name.startsWith('GIT_'))
  );
}

async function runScript(scriptName, args = [], cwd = repositoryRoot) {
  return execFileAsync(
    process.execPath,
    [scriptPath(scriptName), ...args],
    { cwd, env: gitSafeEnvironment() }
  );
}

async function importEntrypoint(scriptName, args = []) {
  const entrypointPath = scriptPath(scriptName);
  const originalArgv = process.argv;

  process.argv = [process.execPath, entrypointPath, ...args];

  try {
    entrypointImportCount += 1;

    await import(`${pathToFileURL(entrypointPath).href}?entrypoint=${entrypointImportCount}`);
  } finally {
    process.argv = originalArgv;
  }
}

async function waitForEntrypoint() {
  await new Promise((resolve) => {
    setTimeout(resolve, 50);
  });
}

async function withWorkingDirectory(directory, callback) {
  const originalDirectory = process.cwd();
  const gitEnvironment = Object.fromEntries(
    Object.entries(process.env).filter(([name]) => name.startsWith('GIT_'))
  );

  for (const name of Object.keys(gitEnvironment)) {
    delete process.env[name];
  }

  process.chdir(directory);

  try {
    return await callback();
  } finally {
    process.chdir(originalDirectory);
    Object.assign(process.env, gitEnvironment);
  }
}

async function runGit(cwd, args) {
  return execFileAsync('git', args, { cwd, env: gitSafeEnvironment() });
}

async function writeReleaseFiles(projectDirectory, {
  changelog = previousChangelog,
  manifestVersion,
  packageLockVersion,
  packageVersion,
  rootPackageVersion
}) {
  await Promise.all([
    writeFile(path.join(projectDirectory, 'CHANGELOG.md'), changelog),
    writeFile(path.join(projectDirectory, 'package.json'), packageFile(packageVersion)),
    writeFile(path.join(projectDirectory, 'manifest.json'), manifestFile(manifestVersion)),
    writeFile(
      path.join(projectDirectory, 'package-lock.json'),
      packageLockFile(packageLockVersion, rootPackageVersion)
    )
  ]);
}

async function stageReleaseFiles(projectDirectory) {
  await runGit(projectDirectory, [
    'add',
    'CHANGELOG.md',
    'package.json',
    'manifest.json',
    'package-lock.json'
  ]);
}

async function createReleaseRepository() {
  const projectDirectory = await mkdtemp(path.join(tmpdir(), 'release-metadata-'));
  temporaryDirectories.push(projectDirectory);

  await runGit(projectDirectory, ['init', '--initial-branch=main']);
  await writeReleaseFiles(projectDirectory, {
    manifestVersion: '1.0.0',
    packageLockVersion: '1.0.0',
    packageVersion: '1.0.0'
  });
  await stageReleaseFiles(projectDirectory);
  await runGit(projectDirectory, [
    '-c',
    'user.name=Test User',
    '-c',
    'user.email=test@example.com',
    'commit',
    '-m',
    'Initial release'
  ]);

  return projectDirectory;
}

async function createBuildProject() {
  const projectDirectory = await mkdtemp(path.join(tmpdir(), 'extension-build-'));
  temporaryDirectories.push(projectDirectory);

  await Promise.all([
    mkdir(path.join(projectDirectory, 'icons')),
    mkdir(path.join(projectDirectory, 'src', 'content'), { recursive: true }),
    mkdir(path.join(projectDirectory, 'src', 'shared'), { recursive: true })
  ]);
  await Promise.all([
    writeFile(path.join(projectDirectory, 'background.js'), 'background'),
    writeFile(
      path.join(projectDirectory, 'content.js'),
      "import { message } from './src/content/entry.js'; globalThis.contentMessage = message;"
    ),
    writeFile(path.join(projectDirectory, 'manifest.json'), JSON.stringify({
      action: {
        default_icon: {
          16: 'icons/icon16.png',
          32: 'icons/icon32.png',
          48: 'icons/icon48.png',
          128: 'icons/icon128.png'
        }
      },
      icons: {
        16: 'icons/icon16.png',
        32: 'icons/icon32.png',
        48: 'icons/icon48.png',
        128: 'icons/icon128.png'
      }
    })),
    writeFile(path.join(projectDirectory, 'popup.css'), 'body {}'),
    writeFile(path.join(projectDirectory, 'popup.html'), '<main></main>'),
    writeFile(path.join(projectDirectory, 'popup.js'), 'popup'),
    writeFile(path.join(projectDirectory, 'icons', 'icon.svg'), '<svg/>'),
    sharp({
      create: {
        background: '#ff0000',
        channels: 4,
        height: 128,
        width: 128
      }
    }).png().toFile(path.join(projectDirectory, 'icons', 'icon-source.png')),
    writeFile(path.join(projectDirectory, 'src', 'content', 'entry.js'), "export const message = 'ready';"),
    writeFile(path.join(projectDirectory, 'src', 'shared', 'commands.js'), 'commands')
  ]);

  return projectDirectory;
}

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(temporaryDirectories.map((directory) => rm(directory, {
    force: true,
    recursive: true
  })));
  temporaryDirectories.length = 0;
});

describe('script entrypoints', () => {
  it('blocks pre-commit checks on main and allows feature branches', async () => {
    const projectDirectory = await createReleaseRepository();

    await expect(runScript('prevent-main-commit.js', [], projectDirectory))
      .rejects.toMatchObject({
        stderr: expect.stringContaining('Commit blocked: create a feature branch')
      });

    await runGit(projectDirectory, ['checkout', '-b', 'feature/release-checks']);

    await expect(runScript('prevent-main-commit.js', [], projectDirectory))
      .resolves.toMatchObject({ stderr: '' });
  });

  it('validates staged release metadata from the pre-commit hook', async () => {
    const projectDirectory = await createReleaseRepository();

    await writeReleaseFiles(projectDirectory, {
      changelog: `${previousChangelog}
## 1.0.1 - 2026-10-01
`,
      manifestVersion: '1.0.1',
      packageLockVersion: '1.0.1',
      packageVersion: '1.0.1'
    });
    await stageReleaseFiles(projectDirectory);

    await expect(runScript('validate-release-metadata.js', [], projectDirectory))
      .resolves.toMatchObject({ stderr: '' });
  });

  it('rejects staged release metadata without a changelog entry', async () => {
    const projectDirectory = await createReleaseRepository();

    await writeReleaseFiles(projectDirectory, {
      manifestVersion: '1.0.1',
      packageLockVersion: '1.0.1',
      packageVersion: '1.0.1'
    });
    await stageReleaseFiles(projectDirectory);

    await expect(runScript('validate-release-metadata.js', [], projectDirectory))
      .rejects.toMatchObject({
        stderr: expect.stringContaining('Commit blocked: add a new CHANGELOG.md entry')
      });
  });

  it('checks package-lock version metadata from the pre-commit hook', async () => {
    const projectDirectory = await mkdtemp(path.join(tmpdir(), 'package-lock-version-'));
    temporaryDirectories.push(projectDirectory);

    await Promise.all([
      writeFile(path.join(projectDirectory, 'package.json'), packageFile('1.0.1')),
      writeFile(path.join(projectDirectory, 'package-lock.json'), packageLockFile('1.0.1'))
    ]);

    await expect(runScript('validate-package-lock-version.js', [], projectDirectory))
      .resolves.toMatchObject({ stderr: '' });

    await writeFile(path.join(projectDirectory, 'package-lock.json'), packageLockFile('1.0.0'));

    await expect(runScript('validate-package-lock-version.js', [], projectDirectory))
      .rejects.toMatchObject({
        stderr: expect.stringContaining('Commit blocked: package-lock.json versions')
      });
  });

  it('validates CI version bump metadata from a base revision', async () => {
    const projectDirectory = await createReleaseRepository();

    await writeReleaseFiles(projectDirectory, {
      manifestVersion: '1.0.1',
      packageLockVersion: '1.0.1',
      packageVersion: '1.0.1'
    });

    await expect(runScript('validate-version-bump.js', ['HEAD'], projectDirectory))
      .resolves.toMatchObject({ stderr: '' });

    await expect(runScript('validate-version-bump.js', [], projectDirectory))
      .rejects.toMatchObject({
        stderr: expect.stringContaining('Version bump validation failed.')
      });
  });

  it('cleans generated output directories from the current project', async () => {
    const projectDirectory = await mkdtemp(path.join(tmpdir(), 'clean-entrypoint-'));
    temporaryDirectories.push(projectDirectory);

    await Promise.all(['coverage', 'dist', 'release'].map((directory) => mkdir(
      path.join(projectDirectory, directory)
    )));

    await runScript('clean.js', [], projectDirectory);

    await expect(access(path.join(projectDirectory, 'coverage'))).rejects.toThrow();
    await expect(access(path.join(projectDirectory, 'dist'))).rejects.toThrow();
    await expect(access(path.join(projectDirectory, 'release'))).rejects.toThrow();
  });

  it('formats a coverage report from the current project', async () => {
    const projectDirectory = await mkdtemp(path.join(tmpdir(), 'coverage-report-'));
    temporaryDirectories.push(projectDirectory);

    await mkdir(path.join(projectDirectory, 'coverage'));
    await writeFile(path.join(projectDirectory, 'coverage', 'coverage-summary.json'), JSON.stringify({
      total: {
        branches: { pct: 91 },
        functions: { pct: 100 },
        lines: { pct: 95 },
        statements: { pct: 94 }
      }
    }));

    await expect(runScript('format-coverage-report.js', [], projectDirectory))
      .resolves.toMatchObject({
        stdout: expect.stringContaining('| Lines | 95.00% |')
      });
  });

  it('generates icons from the command line', async () => {
    const outputDirectory = await mkdtemp(path.join(tmpdir(), 'icons-entrypoint-'));
    temporaryDirectories.push(outputDirectory);

    await runScript('generate-icons.js', [outputDirectory]);

    const iconPath = path.join(outputDirectory, 'icon16.png');
    const iconHeader = await readFile(iconPath);

    expect(iconHeader.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  });

  it('packages the current project distribution from the command line', async () => {
    const projectDirectory = await mkdtemp(path.join(tmpdir(), 'package-entrypoint-'));
    const distDirectory = path.join(projectDirectory, 'dist');
    temporaryDirectories.push(projectDirectory);

    await mkdir(path.join(distDirectory, 'icons'), { recursive: true });
    await Promise.all([
      writeFile(path.join(distDirectory, 'background.js'), 'background'),
      writeFile(path.join(distDirectory, 'manifest.json'), '{"name":"Messages Shortcut Actions"}'),
      writeFile(path.join(distDirectory, 'icons', 'icon16.png'), 'icon')
    ]);

    await runScript('package.js', [], projectDirectory);

    const archiveHeader = await readFile(path.join(
      projectDirectory,
      'release',
      'google-messages-shortcuts.zip'
    ));
    const archive = await JSZip.loadAsync(archiveHeader);

    expect(Object.keys(archive.files).sort()).toEqual([
      'background.js',
      'icons/',
      'icons/icon16.png',
      'manifest.json'
    ]);
  });

  it('builds the current project distribution from the command line', async () => {
    const projectDirectory = await createBuildProject();

    await runScript('build.js', [], projectDirectory);

    await expect(readFile(path.join(projectDirectory, 'dist', 'background.js'), 'utf8'))
      .resolves.toBe('background');
    await expect(readFile(path.join(projectDirectory, 'dist', 'content.js'), 'utf8'))
      .resolves.not.toContain('import ');
  });
});

describe('script entrypoint coverage', () => {
  it('covers pre-commit branch guard execution in-process', async () => {
    const projectDirectory = await createReleaseRepository();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const processExit = vi.spyOn(process, 'exit').mockImplementation(() => {});

    await withWorkingDirectory(projectDirectory, async () => {
      await importEntrypoint('prevent-main-commit.js');
    });

    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('Commit blocked'));
    expect(processExit).toHaveBeenCalledWith(1);

    consoleError.mockRestore();
    processExit.mockRestore();
  });

  it('covers successful release metadata validation in-process', async () => {
    const projectDirectory = await createReleaseRepository();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const processExit = vi.spyOn(process, 'exit').mockImplementation(() => {});

    await writeReleaseFiles(projectDirectory, {
      changelog: `${previousChangelog}
## 1.0.1 - 2026-10-01
`,
      manifestVersion: '1.0.1',
      packageLockVersion: '1.0.1',
      packageVersion: '1.0.1'
    });
    await stageReleaseFiles(projectDirectory);

    await withWorkingDirectory(projectDirectory, async () => {
      await importEntrypoint('validate-release-metadata.js');
    });

    expect(consoleError).not.toHaveBeenCalled();
    expect(processExit).not.toHaveBeenCalled();

    consoleError.mockRestore();
    processExit.mockRestore();
  });

  it('covers rejected release metadata validation in-process', async () => {
    const projectDirectory = await createReleaseRepository();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const processExit = vi.spyOn(process, 'exit').mockImplementation(() => {});

    await writeReleaseFiles(projectDirectory, {
      manifestVersion: '1.0.1',
      packageLockVersion: '1.0.1',
      packageVersion: '1.0.1'
    });
    await stageReleaseFiles(projectDirectory);

    await withWorkingDirectory(projectDirectory, async () => {
      await importEntrypoint('validate-release-metadata.js');
    });

    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('Commit blocked'));
    expect(processExit).toHaveBeenCalledWith(1);

    consoleError.mockRestore();
    processExit.mockRestore();
  });

  it('covers package-lock entrypoint execution in-process', async () => {
    const projectDirectory = await mkdtemp(path.join(tmpdir(), 'package-lock-entrypoint-'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const processExit = vi.spyOn(process, 'exit').mockImplementation(() => {});
    temporaryDirectories.push(projectDirectory);

    await Promise.all([
      writeFile(path.join(projectDirectory, 'package.json'), packageFile('1.0.1')),
      writeFile(path.join(projectDirectory, 'package-lock.json'), packageLockFile('1.0.0'))
    ]);

    await withWorkingDirectory(projectDirectory, async () => {
      await importEntrypoint('validate-package-lock-version.js');
    });

    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('Commit blocked'));
    expect(processExit).toHaveBeenCalledWith(1);

    consoleError.mockRestore();
    processExit.mockRestore();
  });

  it('covers version bump entrypoint execution in-process', async () => {
    const projectDirectory = await createReleaseRepository();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const processExit = vi.spyOn(process, 'exit').mockImplementation(() => {});

    await writeReleaseFiles(projectDirectory, {
      manifestVersion: '1.0.1',
      packageLockVersion: '1.0.1',
      packageVersion: '1.0.1'
    });

    await withWorkingDirectory(projectDirectory, async () => {
      await importEntrypoint('validate-version-bump.js', ['HEAD']);
      await waitForEntrypoint();
    });

    expect(consoleError).not.toHaveBeenCalled();
    expect(processExit).not.toHaveBeenCalled();

    consoleError.mockRestore();
    processExit.mockRestore();
  });

  it('covers utility script entrypoints in-process', async () => {
    const cleanDirectory = await mkdtemp(path.join(tmpdir(), 'clean-entrypoint-'));
    const coverageDirectory = await mkdtemp(path.join(tmpdir(), 'coverage-entrypoint-'));
    const iconsDirectory = await mkdtemp(path.join(tmpdir(), 'icons-entrypoint-'));
    const packageDirectory = await mkdtemp(path.join(tmpdir(), 'package-entrypoint-'));
    const buildDirectory = await createBuildProject();
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const processExit = vi.spyOn(process, 'exit').mockImplementation(() => {});
    temporaryDirectories.push(cleanDirectory, coverageDirectory, iconsDirectory, packageDirectory);

    await Promise.all(['coverage', 'dist', 'release'].map((directory) => mkdir(
      path.join(cleanDirectory, directory)
    )));
    await mkdir(path.join(coverageDirectory, 'coverage'));
    await writeFile(path.join(coverageDirectory, 'coverage', 'coverage-summary.json'), JSON.stringify({
      total: {
        branches: { pct: 91 },
        functions: { pct: 100 },
        lines: { pct: 95 },
        statements: { pct: 94 }
      }
    }));
    await mkdir(path.join(packageDirectory, 'dist', 'icons'), { recursive: true });
    await Promise.all([
      writeFile(path.join(packageDirectory, 'dist', 'background.js'), 'background'),
      writeFile(path.join(packageDirectory, 'dist', 'manifest.json'), '{"name":"Messages Shortcut Actions"}'),
      writeFile(path.join(packageDirectory, 'dist', 'icons', 'icon16.png'), 'icon')
    ]);

    await withWorkingDirectory(cleanDirectory, async () => {
      await importEntrypoint('clean.js');
      await waitForEntrypoint();
    });
    await withWorkingDirectory(coverageDirectory, async () => {
      await importEntrypoint('format-coverage-report.js');
      await waitForEntrypoint();
    });
    await importEntrypoint('generate-icons.js', [iconsDirectory]);
    await waitForEntrypoint();
    await withWorkingDirectory(packageDirectory, async () => {
      await importEntrypoint('package.js');
      await waitForEntrypoint();
    });
    await withWorkingDirectory(buildDirectory, async () => {
      await importEntrypoint('build.js');
      await waitForEntrypoint();
    });

    await expect(access(path.join(cleanDirectory, 'coverage'))).rejects.toThrow();
    expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('| Lines | 95.00% |'));
    await expect(readFile(path.join(iconsDirectory, 'icon16.png'))).resolves.toBeInstanceOf(Buffer);
    await expect(readFile(path.join(packageDirectory, 'release', 'google-messages-shortcuts.zip')))
      .resolves.toBeInstanceOf(Buffer);
    await expect(readFile(path.join(buildDirectory, 'dist', 'background.js'), 'utf8'))
      .resolves.toBe('background');
    expect(consoleError).not.toHaveBeenCalled();
    expect(processExit).not.toHaveBeenCalled();

    consoleLog.mockRestore();
    consoleError.mockRestore();
    processExit.mockRestore();
  });

  it('covers default icon output from the generate-icons entrypoint', async () => {
    const projectDirectory = await mkdtemp(path.join(tmpdir(), 'default-icons-entrypoint-'));
    temporaryDirectories.push(projectDirectory);

    await withWorkingDirectory(projectDirectory, async () => {
      await importEntrypoint('generate-icons.js');
      await waitForEntrypoint();
    });

    await expect(readFile(path.join(projectDirectory, 'icons', 'icon16.png')))
      .resolves.toBeInstanceOf(Buffer);
  });

  it('covers asynchronous CLI failure handlers in-process', async () => {
    const buildDirectory = await mkdtemp(path.join(tmpdir(), 'build-failure-entrypoint-'));
    const coverageDirectory = await mkdtemp(path.join(tmpdir(), 'coverage-failure-entrypoint-'));
    const iconsDirectory = await mkdtemp(path.join(tmpdir(), 'icons-failure-entrypoint-'));
    const packageDirectory = await mkdtemp(path.join(tmpdir(), 'package-failure-entrypoint-'));
    const versionDirectory = await createReleaseRepository();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const processExit = vi.spyOn(process, 'exit').mockImplementation(() => {});
    temporaryDirectories.push(buildDirectory, coverageDirectory, iconsDirectory, packageDirectory);

    await writeFile(path.join(iconsDirectory, 'icons-as-file'), 'not a directory');
    await writeFile(path.join(packageDirectory, 'release'), 'not a directory');
    await writeReleaseFiles(versionDirectory, {
      manifestVersion: '1.0.0',
      packageLockVersion: '1.0.1',
      packageVersion: '1.0.1'
    });

    await withWorkingDirectory(buildDirectory, async () => {
      await importEntrypoint('build.js');
      await waitForEntrypoint();
    });
    await withWorkingDirectory(coverageDirectory, async () => {
      await importEntrypoint('format-coverage-report.js');
      await waitForEntrypoint();
    });
    await importEntrypoint('generate-icons.js', [path.join(iconsDirectory, 'icons-as-file')]);
    await waitForEntrypoint();
    await withWorkingDirectory(packageDirectory, async () => {
      await importEntrypoint('package.js');
      await waitForEntrypoint();
    });
    await withWorkingDirectory(versionDirectory, async () => {
      await importEntrypoint('validate-version-bump.js', ['HEAD']);
      await waitForEntrypoint();
    });

    expect(consoleError).toHaveBeenCalledWith(
      'Failed to build the extension.',
      expect.any(Error)
    );
    expect(consoleError).toHaveBeenCalledWith(
      'Failed to format the coverage report.',
      expect.any(Error)
    );
    expect(consoleError).toHaveBeenCalledWith(
      'Failed to generate icons.',
      expect.any(Error)
    );
    expect(consoleError).toHaveBeenCalledWith(
      'Failed to package the extension.',
      expect.any(Error)
    );
    expect(consoleError).toHaveBeenCalledWith(
      'Version bump validation failed.',
      'package.json, manifest.json, and package-lock.json versions must be synchronized after a bump.'
    );
    expect(processExit).toHaveBeenCalledWith(1);

    consoleError.mockRestore();
    processExit.mockRestore();
  });
});
