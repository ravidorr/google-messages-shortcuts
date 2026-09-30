import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  MENU_ACTION_ATTRIBUTE,
  STYLE_SELECTOR,
  beginMenuAction,
  endMenuAction
} from '../../src/content/menu-action-overlay.js';

describe('menu action overlay', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.documentElement.removeAttribute(MENU_ACTION_ATTRIBUTE);
  });

  afterEach(() => {
    endMenuAction(document);
    document.head.innerHTML = '';
  });

  it('marks the document while a menu action is in progress', () => {
    beginMenuAction(document);

    expect(document.documentElement.getAttribute(MENU_ACTION_ATTRIBUTE)).toBe('true');
  });

  it('clears the document marker when the menu action finishes', () => {
    beginMenuAction(document);
    endMenuAction(document);

    expect(document.documentElement.hasAttribute(MENU_ACTION_ATTRIBUTE)).toBe(false);
  });

  it('injects overlay hide styles once', () => {
    beginMenuAction(document);
    beginMenuAction(document);

    expect(document.querySelectorAll(STYLE_SELECTOR)).toHaveLength(1);
    expect(document.querySelector(STYLE_SELECTOR).textContent).toContain('.mat-mdc-menu-panel');
    expect(document.querySelector(STYLE_SELECTOR).textContent).toContain('.cdk-overlay-backdrop');
  });
});
