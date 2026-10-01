import { runCapabilitySelfTest } from './src/content/adapters/capability-self-test.js';
import { runConversationAction } from './src/content/conversation-action.js';
import {
  installConversationShortcutPills,
  resetConversationShortcutPillInstallationsForTests
} from './src/content/conversation-shortcut-pills.js';
import { handleCommand, installMessageListener } from './src/content/message-handler.js';
import {
  createDefaultPageWorldBridgeHandlers,
  installPageWorldBridgeHost
} from './src/content/page-world-bridge-host.js';

const disconnectMessageListener = installMessageListener();
const disconnectPills = installConversationShortcutPills();
const disconnectPageWorldBridge = installPageWorldBridgeHost(
  document,
  createDefaultPageWorldBridgeHandlers({
    runCapabilitySelfTest,
    handleCommand,
    runConversationAction
  })
);

export function resetContentScriptForTests() {
  disconnectMessageListener();
  disconnectPills();
  disconnectPageWorldBridge();
  resetConversationShortcutPillInstallationsForTests();
}

globalThis.MessagesShortcuts = {
  ...(globalThis.MessagesShortcuts || {}),
  handleCommand,
  runConversationAction,
  runCapabilitySelfTest
};
