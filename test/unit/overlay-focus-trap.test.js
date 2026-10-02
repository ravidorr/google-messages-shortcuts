import { beforeEach, describe, expect, it } from 'vitest';
import {
  getFocusableElements,
  restoreFocus,
  trapTabKey
} from '../../src/content/overlay-focus-trap.js';

describe('overlay-focus-trap', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="panel">
        <button id="first">First</button>
        <button id="second">Second</button>
      </div>
    `;
  });

  it('collects focusable elements and traps tab navigation', () => {
    const panel = document.getElementById('panel');
    const localThis = getFocusableElements(panel);

    expect(localThis).toHaveLength(2);

    panel.querySelector('#second').focus();

    const trapped = trapTabKey({
      key: 'Tab',
      shiftKey: false,
      preventDefault() {}
    }, panel);

    expect(trapped).toBe(true);
    expect(document.activeElement.id).toBe('first');
  });

  it('restores focus to a connected element', () => {
    const button = document.getElementById('first');
    button.focus();
    restoreFocus(button);
    expect(document.activeElement).toBe(button);
  });
});
