import { runConversationAction } from './src/content/conversation-action.js';
import { installConversationShortcutPills } from './src/content/conversation-shortcut-pills.js';
import { handleCommand, installMessageListener } from './src/content/message-handler.js';

installMessageListener();
installConversationShortcutPills();

globalThis.MessagesShortcuts = {
  ...(globalThis.MessagesShortcuts || {}),
  handleCommand,
  runConversationAction
};
