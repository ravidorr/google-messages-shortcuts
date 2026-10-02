import { runCapabilitySelfTest } from './src/content/adapters/capability-self-test.js';
import { runConversationAction } from './src/content/conversation-action.js';
import {
  installConversationShortcutPills,
  resetConversationShortcutPillInstallationsForTests
} from './src/content/conversation-shortcut-pills.js';
import { resetActionFeedbackForTests } from './src/content/action-feedback.js';
import { handleCommand, installMessageListener } from './src/content/message-handler.js';
import {
  installArchivedFab,
  resetArchivedFabInstallationsForTests
} from './src/content/navigation-fab.js';
import {
  installSpamBlockedFab,
  resetSpamBlockedFabInstallationsForTests
} from './src/content/spam-blocked-fab.js';
import {
  createDefaultPageWorldBridgeHandlers,
  installPageWorldBridgeHost
} from './src/content/page-world-bridge-host.js';

const disconnectMessageListener = installMessageListener();
const disconnectPills = installConversationShortcutPills();
const disconnectArchivedFab = installArchivedFab();
const disconnectSpamBlockedFab = installSpamBlockedFab();
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
  disconnectArchivedFab();
  disconnectSpamBlockedFab();
  disconnectPageWorldBridge();
  resetConversationShortcutPillInstallationsForTests();
  resetArchivedFabInstallationsForTests();
  resetSpamBlockedFabInstallationsForTests();
  resetActionFeedbackForTests();
}

globalThis.MessagesShortcuts = {
  ...(globalThis.MessagesShortcuts || {}),
  handleCommand,
  runConversationAction,
  runCapabilitySelfTest
};
