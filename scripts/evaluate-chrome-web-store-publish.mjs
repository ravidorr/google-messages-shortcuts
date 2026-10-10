import { appendFileSync, readFileSync } from 'node:fs';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const FETCH_STATUS_URL = 'https://chromewebstore.googleapis.com/v2';

export function readPackageVersionFromManifest(manifestJson) {
  try {
    const { version } = JSON.parse(manifestJson);
    return typeof version === 'string' && version.length > 0 ? version : null;
  } catch {
    return null;
  }
}

export function readPublishedCrxVersion(fetchStatus) {
  const channels = fetchStatus?.publishedItemRevisionStatus?.distributionChannels;

  if (!Array.isArray(channels)) {
    return null;
  }

  for (const channel of channels) {
    if (typeof channel?.crxVersion === 'string' && channel.crxVersion.length > 0) {
      return channel.crxVersion;
    }
  }

  return null;
}

export function shouldSkipChromeWebStorePublish(packageVersion, publishedCrxVersion) {
  if (!packageVersion || !publishedCrxVersion) {
    return false;
  }

  return packageVersion === publishedCrxVersion;
}

export function evaluateChromeWebStorePublish(packageVersion, fetchStatus) {
  const publishedCrxVersion = readPublishedCrxVersion(fetchStatus);
  const skipPublish = shouldSkipChromeWebStorePublish(packageVersion, publishedCrxVersion);

  return {
    skipPublish,
    packageVersion,
    publishedCrxVersion
  };
}

export async function fetchChromeWebStoreStatus({ accessToken, publisherId, extensionId }) {
  const itemName = `publishers/${publisherId}/items/${extensionId}`;
  const response = await fetch(`${FETCH_STATUS_URL}/${itemName}:fetchStatus`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  const body = await response.text();

  if (!response.ok) {
    throw new Error(`Chrome Web Store fetchStatus failed (${response.status}): ${body}`);
  }

  return JSON.parse(body);
}

function writeGithubOutput(name, value) {
  const outputFile = process.env.GITHUB_OUTPUT;

  if (!outputFile) {
    return;
  }

  appendFileSync(outputFile, `${name}=${value}\n`);
}

export async function runChromeWebStorePublishGuard({
  accessToken,
  publisherId,
  extensionId,
  manifestPath = 'dist/manifest.json'
}) {
  const manifestJson = readFileSync(manifestPath, 'utf8');
  const packageVersion = readPackageVersionFromManifest(manifestJson);

  if (!packageVersion) {
    throw new Error(`${manifestPath} must contain a non-empty manifest version.`);
  }

  const fetchStatus = await fetchChromeWebStoreStatus({
    accessToken,
    publisherId,
    extensionId
  });
  const result = evaluateChromeWebStorePublish(packageVersion, fetchStatus);

  writeGithubOutput('skip_publish', result.skipPublish ? 'true' : 'false');
  writeGithubOutput('package_version', result.packageVersion);
  writeGithubOutput(
    'published_crx_version',
    result.publishedCrxVersion ?? ''
  );

  if (result.skipPublish) {
    process.stdout.write(
      `Skipping Chrome Web Store publish: version ${result.packageVersion} is already published.\n`
    );
    return result;
  }

  if (result.publishedCrxVersion) {
    process.stdout.write(
      `Publishing ${result.packageVersion} (store has ${result.publishedCrxVersion}).\n`
    );
  } else {
    process.stdout.write(
      `Publishing ${result.packageVersion} (no published crxVersion in fetchStatus).\n`
    );
  }

  return result;
}

function runCli() {
  const accessToken = process.env.ACCESS_TOKEN;
  const publisherId = process.env.PUBLISHER_ID;
  const extensionId = process.env.EXTENSION_ID;
  const manifestPath = process.env.MANIFEST_PATH ?? 'dist/manifest.json';

  if (!accessToken || !publisherId || !extensionId) {
    console.error('ACCESS_TOKEN, PUBLISHER_ID, and EXTENSION_ID are required.');
    process.exit(1);
  }

  return runChromeWebStorePublishGuard({
    accessToken,
    publisherId,
    extensionId,
    manifestPath
  }).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}

export const cliExecutionPromise = process.argv[1] === fileURLToPath(import.meta.url)
  ? runCli()
  : undefined;
