import { handleCommandEvent } from './src/background/command-listener.js';

chrome.commands.onCommand.addListener((command) => {
  handleCommandEvent(command);
});
