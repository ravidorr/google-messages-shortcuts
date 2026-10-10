import { beforeEach, describe, expect, it } from 'vitest';
import {
  getExtensionVersion,
  renderExtensionVersion
} from '../../src/popup/popup-view.js';

describe('popup-view', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <p id="extension-version" class="popup__version" hidden></p>
    `;
  });

  it('renders the extension version from the manifest', () => {
    renderExtensionVersion(document, {
      runtime: {
        getManifest: () => ({ version: '1.8.0' })
      }
    });

    const versionElement = document.getElementById('extension-version');

    expect(getExtensionVersion({
      runtime: {
        getManifest: () => ({ version: '1.8.0' })
      }
    })).toBe('1.8.0');
    expect(versionElement.hidden).toBe(false);
    expect(versionElement.textContent).toBe('Version 1.8.0');
  });

  it('leaves the version hidden when manifest metadata is unavailable', () => {
    renderExtensionVersion(document, {});

    expect(document.getElementById('extension-version').hidden).toBe(true);
  });
});
