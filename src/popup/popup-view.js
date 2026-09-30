import { COMMAND_ARCHIVE, COMMAND_MARK_UNREAD, COMMAND_TRASH } from '../shared/commands.js';
import { getCommandIcon } from '../shared/command-icons.js';

export const COMMAND_LABELS = {
  [COMMAND_ARCHIVE]: 'Archive conversation',
  [COMMAND_TRASH]: 'Trash conversation',
  [COMMAND_MARK_UNREAD]: 'Mark conversation as unread'
};

export function getShortcutStatus(shortcut) {
  if (!shortcut) {
    return {
      label: 'Not assigned',
      className: 'shortcut-status shortcut-status--missing'
    };
  }

  return {
    label: shortcut,
    className: 'shortcut-status shortcut-status--assigned'
  };
}

export function renderShortcutRows(commands) {
  const rows = [];

  for (const commandName of [COMMAND_ARCHIVE, COMMAND_TRASH, COMMAND_MARK_UNREAD]) {
    const command = commands.find((entry) => entry.name === commandName);
    const status = getShortcutStatus(command?.shortcut || '');

    rows.push({
      commandName,
      label: COMMAND_LABELS[commandName],
      shortcut: status.label,
      className: status.className
    });
  }

  return rows;
}

function createShortcutIcon(documentRoot, commandName) {
  const icon = getCommandIcon(commandName);
  const svg = documentRoot.createElementNS('http://www.w3.org/2000/svg', 'svg');

  svg.classList.add('shortcut-item__icon');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('viewBox', icon.viewBox);

  for (const pathDefinition of icon.paths) {
    const path = documentRoot.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathDefinition);
    svg.append(path);
  }

  return svg;
}

export function populateShortcutList(container, commands, documentRoot = document) {
  const rows = renderShortcutRows(commands);

  container.replaceChildren();

  for (const row of rows) {
    const item = documentRoot.createElement('li');
    item.className = 'shortcut-item';

    const title = documentRoot.createElement('span');
    title.className = 'shortcut-item__label';
    title.append(createShortcutIcon(documentRoot, row.commandName), row.label);

    const shortcut = documentRoot.createElement('span');
    shortcut.className = row.className;
    shortcut.textContent = row.shortcut;

    item.append(title, shortcut);
    container.append(item);
  }
}
