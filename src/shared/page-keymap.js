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
} from './page-commands.js';

export const PAGE_KEYMAP_COLLISION_NOTE =
  'Provisional page-local bindings. Validate against Google Messages, Chrome, and OS shortcuts before release.';

export const PAGE_KEY_BINDINGS = [
  {
    command: PAGE_COMMAND_NEXT_CONVERSATION,
    code: 'ArrowDown',
    altKey: true,
    label: 'Alt+ArrowDown'
  },
  {
    command: PAGE_COMMAND_PREVIOUS_CONVERSATION,
    code: 'ArrowUp',
    altKey: true,
    label: 'Alt+ArrowUp'
  },
  {
    command: PAGE_COMMAND_OPEN_CONVERSATION,
    code: 'Enter',
    altKey: true,
    label: 'Alt+Enter'
  },
  {
    command: PAGE_COMMAND_RETURN_PREVIOUS,
    code: 'BracketLeft',
    altKey: true,
    label: 'Alt+['
  },
  {
    command: PAGE_COMMAND_NEXT_UNREAD,
    code: 'KeyU',
    altKey: true,
    label: 'Alt+U'
  },
  {
    command: PAGE_COMMAND_PREVIOUS_UNREAD,
    code: 'KeyU',
    altKey: true,
    shiftKey: true,
    label: 'Alt+Shift+U'
  },
  {
    command: PAGE_COMMAND_ESCAPE_TO_LIST,
    code: 'Escape',
    label: 'Escape'
  },
  {
    command: PAGE_COMMAND_FOCUS_COMPOSER,
    code: 'KeyM',
    altKey: true,
    label: 'Alt+M'
  },
  {
    command: PAGE_COMMAND_OPEN_PALETTE,
    code: 'KeyP',
    ctrlKey: true,
    shiftKey: true,
    label: 'Ctrl+Shift+P'
  },
  {
    command: PAGE_COMMAND_OPEN_PALETTE,
    code: 'KeyP',
    metaKey: true,
    shiftKey: true,
    label: 'Command+Shift+P'
  },
  {
    command: PAGE_COMMAND_OPEN_HELP,
    code: 'Slash',
    shiftKey: true,
    label: 'Shift+/'
  }
];

export function matchesKeyBinding(event, binding) {
  return event.code === binding.code
    && Boolean(event.altKey) === Boolean(binding.altKey)
    && Boolean(event.ctrlKey) === Boolean(binding.ctrlKey)
    && Boolean(event.metaKey) === Boolean(binding.metaKey)
    && Boolean(event.shiftKey) === Boolean(binding.shiftKey);
}

export function resolvePageCommandFromEvent(event) {
  for (const binding of PAGE_KEY_BINDINGS) {
    if (matchesKeyBinding(event, binding)) {
      return binding.command;
    }
  }

  return null;
}

export function getPageKeyBindingsForCommand(command) {
  return PAGE_KEY_BINDINGS.filter((binding) => binding.command === command);
}

export function formatPageKeyBindingLabel(binding) {
  return binding.label;
}
