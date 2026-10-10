// @vitest-environment node

import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  evaluateChromeWebStorePublish,
  fetchChromeWebStoreStatus,
  readPackageVersionFromManifest,
  readPublishedCrxVersion,
  runChromeWebStorePublishGuard,
  shouldSkipChromeWebStorePublish
} from '../../scripts/evaluate-chrome-web-store-publish.mjs';

const originalFetch = globalThis.fetch;
const temporaryDirectories = [];

afterEach(async () => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();

  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, {
    force: true,
    recursive: true
  })));
});

async function createTemporaryDirectory() {
  const directory = await mkdtemp(path.join(tmpdir(), 'gms-cws-guard-'));
  temporaryDirectories.push(directory);
  return directory;
}

describe('evaluate-chrome-web-store-publish', () => {
  it('reads the manifest version', () => {
    const localThis = readPackageVersionFromManifest(JSON.stringify({ version: '1.14.24' }));

    expect(localThis).toBe('1.14.24');
  });

  it('rejects invalid manifest versions', () => {
    expect(readPackageVersionFromManifest('not-json')).toBeNull();
    expect(readPackageVersionFromManifest(JSON.stringify({ version: 1 }))).toBeNull();
    expect(readPackageVersionFromManifest(JSON.stringify({ name: 'x' }))).toBeNull();
  });

  it('reads the published crxVersion from fetchStatus', () => {
    const localThis = readPublishedCrxVersion({
      publishedItemRevisionStatus: {
        distributionChannels: [{ deployPercentage: 100, crxVersion: '1.14.24' }]
      }
    });

    expect(localThis).toBe('1.14.24');
  });

  it('returns null when fetchStatus has no published channels', () => {
    expect(readPublishedCrxVersion({})).toBeNull();
    expect(readPublishedCrxVersion({
      publishedItemRevisionStatus: { distributionChannels: [{ deployPercentage: 100 }] }
    })).toBeNull();
  });

  it('skips publish when the packaged version matches the store', () => {
    const localThis = shouldSkipChromeWebStorePublish('1.14.24', '1.14.24');

    expect(localThis).toBe(true);
  });

  it('does not skip when either version is missing', () => {
    expect(shouldSkipChromeWebStorePublish('', '1.14.24')).toBe(false);
    expect(shouldSkipChromeWebStorePublish('1.14.24', '')).toBe(false);
  });

  it('does not skip when the store has no published crxVersion', () => {
    const localThis = evaluateChromeWebStorePublish('1.14.24', {});

    expect(localThis.skipPublish).toBe(false);
    expect(localThis.publishedCrxVersion).toBeNull();
  });

  it('does not skip when the packaged version is newer', () => {
    const localThis = evaluateChromeWebStorePublish('1.14.25', {
      publishedItemRevisionStatus: {
        distributionChannels: [{ crxVersion: '1.14.24' }]
      }
    });

    expect(localThis.skipPublish).toBe(false);
  });

  it('fetches Chrome Web Store status', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify({ itemId: 'abc' })
    }));

    const localThis = await fetchChromeWebStoreStatus({
      accessToken: 'token',
      publisherId: 'pub',
      extensionId: 'ext'
    });

    expect(localThis.itemId).toBe('abc');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://chromewebstore.googleapis.com/v2/publishers/pub/items/ext:fetchStatus',
      { headers: { Authorization: 'Bearer token' } }
    );
  });

  it('throws when fetchStatus fails', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      status: 403,
      text: async () => 'denied'
    }));

    await expect(fetchChromeWebStoreStatus({
      accessToken: 'token',
      publisherId: 'pub',
      extensionId: 'ext'
    })).rejects.toThrow('Chrome Web Store fetchStatus failed (403): denied');
  });

  it('writes skip outputs when the store already has the packaged version', async () => {
    const directory = await createTemporaryDirectory();
    const manifestPath = path.join(directory, 'manifest.json');
    const outputPath = path.join(directory, 'github-output.txt');
    await writeFile(manifestPath, JSON.stringify({ version: '1.14.24' }));

    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify({
        publishedItemRevisionStatus: {
          distributionChannels: [{ crxVersion: '1.14.24' }]
        }
      })
    }));

    const logger = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const previousOutput = process.env.GITHUB_OUTPUT;
    process.env.GITHUB_OUTPUT = outputPath;

    try {
      const localThis = await runChromeWebStorePublishGuard({
        accessToken: 'token',
        publisherId: 'pub',
        extensionId: 'ext',
        manifestPath
      });

      expect(localThis.skipPublish).toBe(true);
      expect(await readFile(outputPath, 'utf8')).toContain('skip_publish=true');
      expect(logger).toHaveBeenCalledWith(
        'Skipping Chrome Web Store publish: version 1.14.24 is already published.\n'
      );
    } finally {
      process.env.GITHUB_OUTPUT = previousOutput;
    }
  });

  it('writes continue outputs when the store version differs', async () => {
    const directory = await createTemporaryDirectory();
    const manifestPath = path.join(directory, 'manifest.json');
    const outputPath = path.join(directory, 'github-output.txt');
    await writeFile(manifestPath, JSON.stringify({ version: '1.14.25' }));

    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify({
        publishedItemRevisionStatus: {
          distributionChannels: [{ crxVersion: '1.14.24' }]
        }
      })
    }));

    const logger = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const previousOutput = process.env.GITHUB_OUTPUT;
    process.env.GITHUB_OUTPUT = outputPath;

    try {
      const localThis = await runChromeWebStorePublishGuard({
        accessToken: 'token',
        publisherId: 'pub',
        extensionId: 'ext',
        manifestPath
      });

      expect(localThis.skipPublish).toBe(false);
      expect(await readFile(outputPath, 'utf8')).toContain('skip_publish=false');
      expect(logger).toHaveBeenCalledWith(
        'Publishing 1.14.25 (store has 1.14.24).\n'
      );
    } finally {
      process.env.GITHUB_OUTPUT = previousOutput;
    }
  });

  it('logs when fetchStatus has no published crxVersion', async () => {
    const directory = await createTemporaryDirectory();
    const manifestPath = path.join(directory, 'manifest.json');
    await writeFile(manifestPath, JSON.stringify({ version: '1.14.25' }));

    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify({})
    }));

    const logger = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const previousOutput = process.env.GITHUB_OUTPUT;
    delete process.env.GITHUB_OUTPUT;

    try {
      await runChromeWebStorePublishGuard({
        accessToken: 'token',
        publisherId: 'pub',
        extensionId: 'ext',
        manifestPath
      });

      expect(logger).toHaveBeenCalledWith(
        'Publishing 1.14.25 (no published crxVersion in fetchStatus).\n'
      );
    } finally {
      process.env.GITHUB_OUTPUT = previousOutput;
    }
  });

  it('rejects manifests without a version', async () => {
    const directory = await createTemporaryDirectory();
    const manifestPath = path.join(directory, 'manifest.json');
    await writeFile(manifestPath, JSON.stringify({ name: 'x' }));

    await expect(runChromeWebStorePublishGuard({
      accessToken: 'token',
      publisherId: 'pub',
      extensionId: 'ext',
      manifestPath
    })).rejects.toThrow('must contain a non-empty manifest version');
  });

  it('runs the CLI entrypoint when required env vars are missing', async () => {
    const scriptPath = fileURLToPath(new URL('../../scripts/evaluate-chrome-web-store-publish.mjs', import.meta.url));
    const scriptUrl = `${pathToFileURL(scriptPath).href}?missing-env=${Date.now()}`;
    const originalArgv = process.argv;
    const errorLogger = vi.spyOn(console, 'error').mockImplementation(() => {});
    const exit = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`exit:${code}`);
    });

    delete process.env.ACCESS_TOKEN;
    delete process.env.PUBLISHER_ID;
    delete process.env.EXTENSION_ID;
    process.argv = ['node', scriptPath];

    try {
      vi.resetModules();
      await expect(import(scriptUrl)).rejects.toThrow('exit:1');
      expect(errorLogger).toHaveBeenCalledWith(
        'ACCESS_TOKEN, PUBLISHER_ID, and EXTENSION_ID are required.'
      );
    } finally {
      process.argv = originalArgv;
      exit.mockRestore();
    }
  });

  it('runs the CLI entrypoint when env vars are present', async () => {
    const directory = await createTemporaryDirectory();
    const manifestPath = path.join(directory, 'manifest.json');
    await writeFile(manifestPath, JSON.stringify({ version: '1.14.24' }));

    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify({
        publishedItemRevisionStatus: {
          distributionChannels: [{ crxVersion: '1.14.24' }]
        }
      })
    }));

    const scriptPath = fileURLToPath(new URL('../../scripts/evaluate-chrome-web-store-publish.mjs', import.meta.url));
    const scriptUrl = `${pathToFileURL(scriptPath).href}?cli=${Date.now()}`;
    const originalArgv = process.argv;
    const originalManifestPath = process.env.MANIFEST_PATH;
    const originalAccessToken = process.env.ACCESS_TOKEN;
    const originalPublisherId = process.env.PUBLISHER_ID;
    const originalExtensionId = process.env.EXTENSION_ID;

    process.argv = ['node', scriptPath];
    process.env.MANIFEST_PATH = manifestPath;
    process.env.ACCESS_TOKEN = 'token';
    process.env.PUBLISHER_ID = 'pub';
    process.env.EXTENSION_ID = 'ext';

    try {
      vi.resetModules();
      const entrypoint = await import(scriptUrl);
      await entrypoint.cliExecutionPromise;
    } finally {
      process.argv = originalArgv;
      process.env.MANIFEST_PATH = originalManifestPath;
      process.env.ACCESS_TOKEN = originalAccessToken;
      process.env.PUBLISHER_ID = originalPublisherId;
      process.env.EXTENSION_ID = originalExtensionId;
    }
  });

  it('exits when the CLI guard fails with a non-Error rejection', async () => {
    const directory = await createTemporaryDirectory();
    const manifestPath = path.join(directory, 'manifest.json');
    await writeFile(manifestPath, JSON.stringify({ version: '1.14.24' }));

    globalThis.fetch = vi.fn(async () => {
      throw 'plain failure';
    });

    const scriptPath = fileURLToPath(new URL('../../scripts/evaluate-chrome-web-store-publish.mjs', import.meta.url));
    const scriptUrl = `${pathToFileURL(scriptPath).href}?cli-plain-fail=${Date.now()}`;
    const originalArgv = process.argv;
    const originalManifestPath = process.env.MANIFEST_PATH;
    const errorLogger = vi.spyOn(console, 'error').mockImplementation(() => {});
    const exit = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`exit:${code}`);
    });

    process.argv = ['node', scriptPath];
    process.env.MANIFEST_PATH = manifestPath;
    process.env.ACCESS_TOKEN = 'token';
    process.env.PUBLISHER_ID = 'pub';
    process.env.EXTENSION_ID = 'ext';

    try {
      vi.resetModules();
      const entrypoint = await import(scriptUrl);
      await expect(entrypoint.cliExecutionPromise).rejects.toThrow('exit:1');
      expect(errorLogger).toHaveBeenCalledWith('plain failure');
    } finally {
      process.argv = originalArgv;
      process.env.MANIFEST_PATH = originalManifestPath;
      exit.mockRestore();
    }
  });

  it('exits when the CLI guard fails', async () => {
    const directory = await createTemporaryDirectory();
    const manifestPath = path.join(directory, 'manifest.json');
    await writeFile(manifestPath, JSON.stringify({ version: '1.14.24' }));

    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      status: 500,
      text: async () => 'broken'
    }));

    const scriptPath = fileURLToPath(new URL('../../scripts/evaluate-chrome-web-store-publish.mjs', import.meta.url));
    const scriptUrl = `${pathToFileURL(scriptPath).href}?cli-fail=${Date.now()}`;
    const originalArgv = process.argv;
    const originalManifestPath = process.env.MANIFEST_PATH;
    const errorLogger = vi.spyOn(console, 'error').mockImplementation(() => {});
    const exit = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`exit:${code}`);
    });

    process.argv = ['node', scriptPath];
    process.env.MANIFEST_PATH = manifestPath;
    process.env.ACCESS_TOKEN = 'token';
    process.env.PUBLISHER_ID = 'pub';
    process.env.EXTENSION_ID = 'ext';

    try {
      vi.resetModules();
      const entrypoint = await import(scriptUrl);
      await expect(entrypoint.cliExecutionPromise).rejects.toThrow('exit:1');
      expect(errorLogger).toHaveBeenCalledWith(
        'Chrome Web Store fetchStatus failed (500): broken'
      );
    } finally {
      process.argv = originalArgv;
      process.env.MANIFEST_PATH = originalManifestPath;
      exit.mockRestore();
    }
  });
});
