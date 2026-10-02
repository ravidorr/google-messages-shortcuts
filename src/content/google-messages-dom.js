import { ARCHIVED_SELECTORS } from './adapters/archived-adapter.js';
import { LIST_SELECTORS } from './adapters/list-adapter.js';
import { MENU_SELECTORS, MENU_TEXT } from './adapters/menu-adapter.js';

export { ARCHIVED_SELECTORS, LIST_SELECTORS, MENU_SELECTORS, MENU_TEXT };

export const SELECTORS = {
  ...LIST_SELECTORS,
  ...MENU_SELECTORS,
  ...ARCHIVED_SELECTORS
};
