import { beforeEach, describe, expect, it } from 'vitest';
import {
  ARCHIVED_FAB_ATTRIBUTE,
  ARCHIVED_FAB_ROW_ATTRIBUTE,
  createArchivedFab
} from '../../src/content/navigation-fab.js';
import {
  injectNavigationTileStyles,
  NAV_TILE_BADGE_HOST_CLASS,
  NAV_TILE_DISABLED_ATTRIBUTE,
  NAV_TILE_STYLE_SELECTOR,
  normalizeNavigationTileLink,
  normalizeNavigationTileRow,
  removeNavigationTileStyles
} from '../../src/content/navigation-tile-styles.js';
import { createSpamBlockedFab } from '../../src/content/spam-blocked-fab.js';
import { startChatFabSurface } from '../fixtures/dom/list-states.js';

describe('navigation-tile-styles', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
  });

  it('injects isolated tile styles with legacy resets and explicit colors', () => {
    injectNavigationTileStyles(document);

    const styles = document.querySelector(NAV_TILE_STYLE_SELECTOR).textContent;

    expect(styles).toContain('margin-top: 8px !important');
    expect(styles).toContain('width: 300px !important');
    expect(styles).toContain('position: static !important');
    expect(styles).toContain('grid-template-columns: repeat(3, 84px) !important');
    expect(styles).toContain('all: unset');
    expect(styles).toContain('box-shadow: none !important');
    expect(styles).toContain('background: #d3e3fd !important');
    expect(styles).toContain('color: #041e49 !important');
    expect(styles).toContain('background: #f0f4f9 !important');
    expect(styles).toContain('color: #1f1f1f !important');
    expect(styles).toContain('fill: #0b57d0 !important');
    expect(styles).toContain('color: #444746 !important');
    expect(styles).toContain('opacity: 0.38 !important');
    expect(styles).toContain('top: -6px !important');
    expect(styles).toContain('right: -2px !important');
  });

  it('normalizes tile links and rows for all three navigation controls', () => {
    document.body.innerHTML = `<div ${ARCHIVED_FAB_ROW_ATTRIBUTE}>${startChatFabSurface}</div>`;
    const row = document.querySelector(`[${ARCHIVED_FAB_ROW_ATTRIBUTE}]`);
    const startChatContainer = row.querySelector('mw-fab-link.start-chat');

    row.append(
      createArchivedFab(document, startChatContainer, () => {}),
      createSpamBlockedFab(startChatContainer, () => {})
    );
    normalizeNavigationTileRow(row);

    const startLink = row.querySelector('a[data-e2e-start-button]');
    const archivedLink = row.querySelector(`[${ARCHIVED_FAB_ATTRIBUTE}]`);
    const spamLink = row.querySelector('[data-messages-shortcuts-spam-blocked-fab]');

    expect(row.classList.contains('gm-nav-row')).toBe(true);
    expect(startLink.classList.contains('gm-nav-tile-start')).toBe(true);
    expect(archivedLink.classList.contains('gm-nav-tile-neutral')).toBe(true);
    expect(spamLink.classList.contains('gm-nav-tile-neutral')).toBe(true);
    expect(spamLink.querySelector('.fab-label').textContent).toBe('Spam & blocked');
  });

  it('ignores missing links and rows during normalization', () => {
    expect(() => normalizeNavigationTileRow(null)).not.toThrow();
    expect(() => normalizeNavigationTileLink(null, 'start')).not.toThrow();
  });

  it('does not inject duplicate stylesheets and removes them on teardown', () => {
    injectNavigationTileStyles(document);
    injectNavigationTileStyles(document);

    expect(document.querySelectorAll(NAV_TILE_STYLE_SELECTOR)).toHaveLength(1);

    removeNavigationTileStyles(document);

    expect(document.querySelector(NAV_TILE_STYLE_SELECTOR)).toBeNull();
  });

  it('supports disabled tile opacity without affecting modal-covered state', () => {
    injectNavigationTileStyles(document);
    document.body.innerHTML = startChatFabSurface;
    const link = document.querySelector('a[data-e2e-start-button]');

    normalizeNavigationTileLink(link, 'start');
    link.setAttribute(NAV_TILE_DISABLED_ATTRIBUTE, '');

    expect(link.classList.contains(NAV_TILE_BADGE_HOST_CLASS)).toBe(false);
    expect(document.querySelector(NAV_TILE_STYLE_SELECTOR).textContent)
      .toContain(`[${NAV_TILE_DISABLED_ATTRIBUTE}]`);
  });
});
