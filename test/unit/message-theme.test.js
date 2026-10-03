import { beforeEach, describe, expect, it } from 'vitest';
import {
  classifyMessageTheme,
  MESSAGE_THEME_ATTRIBUTE,
  MESSAGE_THEME_DARK,
  MESSAGE_THEME_LIGHT,
  syncMessageTheme
} from '../../src/content/message-theme.js';

describe('message-theme', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('classifies opaque light and dark CSS colors', () => {
    expect(classifyMessageTheme('rgb(32, 33, 36)')).toBe(MESSAGE_THEME_DARK);
    expect(classifyMessageTheme('#000')).toBe(MESSAGE_THEME_DARK);
    expect(classifyMessageTheme('#f0f4f9')).toBe(MESSAGE_THEME_LIGHT);
    expect(classifyMessageTheme('#abc')).toBe(MESSAGE_THEME_DARK);
    expect(classifyMessageTheme('rgba(32, 33, 36, 1)')).toBe(MESSAGE_THEME_DARK);
  });

  it('defaults malformed, transparent, and out-of-range colors to light', () => {
    expect(classifyMessageTheme('rgb(300, 33, 36)')).toBe(MESSAGE_THEME_LIGHT);
    expect(classifyMessageTheme('rgba(32, 33, 300, 1)')).toBe(MESSAGE_THEME_LIGHT);
    expect(classifyMessageTheme('rgba(32, 33, 36, 0.5)')).toBe(MESSAGE_THEME_LIGHT);
    expect(classifyMessageTheme(undefined)).toBe(MESSAGE_THEME_LIGHT);
  });

  it('synchronizes an extension host from its native sidebar ancestor', () => {
    document.body.innerHTML = `
      <aside style="background-color: rgb(32, 33, 36)">
        <div id="host"></div>
      </aside>
    `;
    const localThis = document.getElementById('host');

    expect(syncMessageTheme(localThis)).toBe(MESSAGE_THEME_DARK);
    expect(localThis.getAttribute(MESSAGE_THEME_ATTRIBUTE)).toBe(MESSAGE_THEME_DARK);
  });

  it('defaults to light without an opaque native surface', () => {
    const localThis = document.createElement('div');

    expect(syncMessageTheme(null)).toBe(MESSAGE_THEME_LIGHT);
    expect(syncMessageTheme(localThis)).toBe(MESSAGE_THEME_LIGHT);
    expect(localThis.getAttribute(MESSAGE_THEME_ATTRIBUTE)).toBe(MESSAGE_THEME_LIGHT);
  });
});
