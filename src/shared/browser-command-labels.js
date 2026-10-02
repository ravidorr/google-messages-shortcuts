import { MANIFEST_COMMANDS } from './commands.js';
import { UNASSIGNED_SHORTCUT_LABEL } from './shortcut-labels.js';

export const MESSAGE_GET_BROWSER_COMMAND_LABELS = 'get-browser-command-labels';

export function getBrowserCommandLabelMap(commands) {
  const labels = {};

  for (const commandName of MANIFEST_COMMANDS) {
    labels[commandName] = commands.find((command) => command.name === commandName)?.shortcut
      || UNASSIGNED_SHORTCUT_LABEL;
  }

  return labels;
}

export function getFallbackBrowserCommandLabelMap() {
  return Object.fromEntries(
    MANIFEST_COMMANDS.map((commandName) => [commandName, UNASSIGNED_SHORTCUT_LABEL])
  );
}
