import { describe, expect, it } from 'vitest';
import {
  getBrowserCommandLabelMap,
  getFallbackBrowserCommandLabelMap
} from '../../src/shared/browser-command-labels.js';
import { COMMAND_ARCHIVE } from '../../src/shared/commands.js';

describe('browser-command-labels', () => {
  it('maps browser command labels and provides fallbacks', () => {
    const localThis = getBrowserCommandLabelMap([
      { name: COMMAND_ARCHIVE, shortcut: 'Ctrl+Shift+Y' }
    ]);

    expect(localThis[COMMAND_ARCHIVE]).toBe('Ctrl+Shift+Y');
    expect(getFallbackBrowserCommandLabelMap()[COMMAND_ARCHIVE]).toBe('Not assigned');
  });
});
