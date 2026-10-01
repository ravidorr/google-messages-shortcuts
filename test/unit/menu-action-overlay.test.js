import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  MENU_ACTION_ATTRIBUTE,
  STYLE_SELECTOR,
  beginMenuAction,
  dismissOpenRowMenu,
  endMenuAction,
  isRowMenuOpen
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
    expect(document.querySelector(STYLE_SELECTOR).textContent).toContain('.conversation-actions-menu');
    expect(document.querySelector(STYLE_SELECTOR).textContent).toContain('.cdk-overlay-backdrop');
  });

  it('detects open row menus', () => {
    expect(isRowMenuOpen(document)).toBe(false);

    document.body.innerHTML = `
      <div role="menu" class="conversation-actions-menu mat-mdc-menu-panel"></div>
    `;

    expect(isRowMenuOpen(document)).toBe(true);
  });

  it('dismisses open row menus with Escape or backdrop click', () => {
    document.body.innerHTML = `
      <div class="cdk-overlay-container">
        <div class="cdk-overlay-backdrop"></div>
        <div role="menu" class="conversation-actions-menu mat-mdc-menu-panel"></div>
      </div>
    `;
    const backdrop = document.querySelector('.cdk-overlay-backdrop');
    backdrop.addEventListener('click', () => {
      document.querySelector('.conversation-actions-menu').remove();
    });

    expect(dismissOpenRowMenu(document)).toBe(true);
    expect(isRowMenuOpen(document)).toBe(false);
  });

  it('closes open row menus when ending a menu action', () => {
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        document.querySelector('.conversation-actions-menu')?.remove();
      }
    });
    document.body.innerHTML = `
      <div role="menu" class="conversation-actions-menu mat-mdc-menu-panel"></div>
    `;

    beginMenuAction(document);
    endMenuAction(document);

    expect(isRowMenuOpen(document)).toBe(false);
    expect(document.documentElement.hasAttribute(MENU_ACTION_ATTRIBUTE)).toBe(false);
  });
});
