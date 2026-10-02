import {
  COMMAND_ARCHIVE,
  COMMAND_MARK_READ,
  COMMAND_MARK_UNREAD,
  COMMAND_OPEN_ARCHIVED,
  COMMAND_OPEN_SPAM_BLOCKED,
  COMMAND_START_CHAT,
  COMMAND_TRASH
} from '../shared/commands.js';
import {
  PAGE_COMMAND_ESCAPE_TO_LIST,
  PAGE_COMMAND_FOCUS_COMPOSER,
  PAGE_COMMAND_NEXT_CONVERSATION,
  PAGE_COMMAND_NEXT_UNREAD,
  PAGE_COMMAND_OPEN_CONVERSATION,
  PAGE_COMMAND_OPEN_HELP,
  PAGE_COMMAND_OPEN_PALETTE,
  PAGE_COMMAND_PREVIOUS_CONVERSATION,
  PAGE_COMMAND_PREVIOUS_UNREAD,
  PAGE_COMMAND_RETURN_PREVIOUS
} from '../shared/page-commands.js';
import { getPageKeyBindingsForCommand, formatPageKeyBindingLabel } from '../shared/page-keymap.js';
import { COMPOSER_CAPABILITY_IDS } from './adapters/composer-adapter.js';
import { CAPABILITY_SUPPORTED, CAPABILITY_UNSAFE } from './adapters/capability-states.js';
import { assessPageCapabilities } from './adapters/page-adapter.js';

export const COMMAND_SOURCE_PAGE = 'page';
export const COMMAND_SOURCE_BROWSER = 'browser';

function formatBindingLabels(command) {
  return getPageKeyBindingsForCommand(command).map(formatPageKeyBindingLabel);
}

function createPageEntry(command, label, description) {
  return {
    command,
    label,
    description,
    source: COMMAND_SOURCE_PAGE,
    filterText: `${label} ${description}`.toLowerCase()
  };
}

function createBrowserEntry(command, label, description) {
  return {
    command,
    label,
    description,
    source: COMMAND_SOURCE_BROWSER,
    bindingLabels: [],
    filterText: `${label} ${description}`.toLowerCase()
  };
}

const BASE_COMMAND_ENTRIES = [
  createPageEntry(
    PAGE_COMMAND_NEXT_CONVERSATION,
    'Next conversation',
    'Move the list cursor to the next loaded conversation.'
  ),
  createPageEntry(
    PAGE_COMMAND_PREVIOUS_CONVERSATION,
    'Previous conversation',
    'Move the list cursor to the previous loaded conversation.'
  ),
  createPageEntry(
    PAGE_COMMAND_OPEN_CONVERSATION,
    'Open conversation',
    'Open the conversation under the current list cursor.'
  ),
  createPageEntry(
    PAGE_COMMAND_RETURN_PREVIOUS,
    'Return to previous conversation',
    'Reopen the last extension-opened conversation when it is still uniquely loaded.'
  ),
  createPageEntry(
    PAGE_COMMAND_NEXT_UNREAD,
    'Next unread',
    'Move the list cursor to the next unread conversation in the loaded list.'
  ),
  createPageEntry(
    PAGE_COMMAND_PREVIOUS_UNREAD,
    'Previous unread',
    'Move the list cursor to the previous unread conversation in the loaded list.'
  ),
  createPageEntry(
    PAGE_COMMAND_ESCAPE_TO_LIST,
    'Focus conversation list',
    'Return focus to the conversation list from supported contexts.'
  ),
  createPageEntry(
    PAGE_COMMAND_FOCUS_COMPOSER,
    'Focus composer',
    'Move focus to the message composer when the composer capability is supported.'
  ),
  createPageEntry(
    PAGE_COMMAND_OPEN_PALETTE,
    'Open command palette',
    'Filter extension commands and view availability.'
  ),
  createPageEntry(
    PAGE_COMMAND_OPEN_HELP,
    'Shortcut reference',
    'Show page-local and browser-assigned shortcut bindings.'
  ),
  createBrowserEntry(
    COMMAND_ARCHIVE,
    'Archive conversation',
    'Archive the selected or hovered conversation.'
  ),
  createBrowserEntry(
    COMMAND_TRASH,
    'Move conversation to trash',
    'Move the selected or hovered conversation to trash.'
  ),
  createBrowserEntry(
    COMMAND_MARK_READ,
    'Mark conversation as read',
    'Mark the selected or hovered conversation as read.'
  ),
  createBrowserEntry(
    COMMAND_MARK_UNREAD,
    'Mark conversation as unread',
    'Mark the selected or hovered conversation as unread.'
  ),
  createBrowserEntry(
    COMMAND_OPEN_ARCHIVED,
    'Open Archived',
    'Open the Archived conversations dialog.'
  ),
  createBrowserEntry(
    COMMAND_START_CHAT,
    'Start chat',
    'Open the new conversation view.'
  ),
  createBrowserEntry(
    COMMAND_OPEN_SPAM_BLOCKED,
    'Open Spam & blocked',
    'Open the Spam & blocked dialog.'
  )
];

export function getBaseCommandEntries() {
  return BASE_COMMAND_ENTRIES.map((entry) => ({ ...entry }));
}

export function resolveCommandAvailability(entry, documentRoot = document) {
  if (entry.command === PAGE_COMMAND_FOCUS_COMPOSER) {
    const capabilities = assessPageCapabilities(documentRoot);
    const focusCapability = capabilities.composer[COMPOSER_CAPABILITY_IDS.focus];

    if (focusCapability.state === CAPABILITY_SUPPORTED) {
      return {
        status: 'available',
        detail: focusCapability.reason
      };
    }

    return {
      status: focusCapability.state === CAPABILITY_UNSAFE ? 'unsafe' : 'unavailable',
      detail: focusCapability.reason
    };
  }

  if (entry.source === COMMAND_SOURCE_BROWSER) {
    return {
      status: 'browser-assigned',
      detail: 'Assign this shortcut in chrome://extensions/shortcuts.'
    };
  }

  return {
    status: 'available',
    detail: 'Available in the current page context when the extension is not paused.'
  };
}

export function getCommandRegistryEntries(documentRoot = document) {
  return getBaseCommandEntries().map((entry) => ({
    ...entry,
    bindingLabels: entry.source === COMMAND_SOURCE_PAGE
      ? formatBindingLabels(entry.command)
      : [],
    availability: resolveCommandAvailability(entry, documentRoot)
  }));
}

export function filterCommandRegistryEntries(entries, query) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return entries;
  }

  return entries.filter((entry) => entry.filterText.includes(normalizedQuery));
}

export function getCommandRegistryEntry(command, documentRoot = document) {
  return getCommandRegistryEntries(documentRoot).find((entry) => entry.command === command) ?? null;
}
