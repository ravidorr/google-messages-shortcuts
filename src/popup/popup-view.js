export function getExtensionVersion(chromeApi = chrome) {
  return chromeApi.runtime?.getManifest?.()?.version ?? '';
}

export function renderExtensionVersion(documentRoot = document, chromeApi = chrome) {
  const versionElement = documentRoot.getElementById('extension-version');
  const version = getExtensionVersion(chromeApi);

  if (!versionElement || !version) {
    return;
  }

  versionElement.textContent = `Version ${version}`;
  versionElement.hidden = false;
}
