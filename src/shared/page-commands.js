export const PAGE_COMMAND_NEXT_CONVERSATION = 'page-next-conversation';
export const PAGE_COMMAND_PREVIOUS_CONVERSATION = 'page-previous-conversation';
export const PAGE_COMMAND_OPEN_CONVERSATION = 'page-open-conversation';
export const PAGE_COMMAND_RETURN_PREVIOUS = 'page-return-previous';
export const PAGE_COMMAND_NEXT_UNREAD = 'page-next-unread';
export const PAGE_COMMAND_PREVIOUS_UNREAD = 'page-previous-unread';
export const PAGE_COMMAND_ESCAPE_TO_LIST = 'page-escape-to-list';
export const PAGE_COMMAND_FOCUS_COMPOSER = 'page-focus-composer';
export const PAGE_COMMAND_OPEN_PALETTE = 'page-open-palette';
export const PAGE_COMMAND_OPEN_HELP = 'page-open-help';

export const PAGE_COMMANDS = [
  PAGE_COMMAND_NEXT_CONVERSATION,
  PAGE_COMMAND_PREVIOUS_CONVERSATION,
  PAGE_COMMAND_OPEN_CONVERSATION,
  PAGE_COMMAND_RETURN_PREVIOUS,
  PAGE_COMMAND_NEXT_UNREAD,
  PAGE_COMMAND_PREVIOUS_UNREAD,
  PAGE_COMMAND_ESCAPE_TO_LIST,
  PAGE_COMMAND_FOCUS_COMPOSER,
  PAGE_COMMAND_OPEN_PALETTE,
  PAGE_COMMAND_OPEN_HELP
];

export const PAGE_COMMAND_SET = new Set(PAGE_COMMANDS);

export function isPageCommand(command) {
  return PAGE_COMMAND_SET.has(command);
}
