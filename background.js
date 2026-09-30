import { handleCommandEvent } from './src/background/command-listener.js';
import { installShortcutLabelListener } from './src/background/shortcut-label-listener.js';

chrome.commands.onCommand.addListener((command) => {
  handleCommandEvent(command);
});

installShortcutLabelListener();
