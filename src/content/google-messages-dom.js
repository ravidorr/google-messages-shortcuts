import { ARCHIVED_SELECTORS } from './adapters/archived-adapter.js';
import { LIST_SELECTORS } from './adapters/list-adapter.js';
import { MENU_SELECTORS, MENU_TEXT } from './adapters/menu-adapter.js';
import { SPAM_BLOCKED_SELECTORS } from './adapters/spam-blocked-adapter.js';
import { START_CHAT_SELECTORS } from './adapters/start-chat-adapter.js';

export {
  ARCHIVED_SELECTORS,
  LIST_SELECTORS,
  MENU_SELECTORS,
  MENU_TEXT,
  SPAM_BLOCKED_SELECTORS,
  START_CHAT_SELECTORS
};

export const SELECTORS = {
  ...LIST_SELECTORS,
  ...MENU_SELECTORS,
  ...ARCHIVED_SELECTORS,
  ...SPAM_BLOCKED_SELECTORS
};
