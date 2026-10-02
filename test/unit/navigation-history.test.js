import { beforeEach, describe, expect, it } from 'vitest';
import {
  consumePreviousConversationIdentity,
  peekPreviousConversationIdentity,
  recordOpenedConversation,
  resetNavigationHistoryForTests
} from '../../src/content/navigation-history.js';

describe('navigation-history', () => {
  beforeEach(() => {
    resetNavigationHistoryForTests();
  });

  it('records unique opened conversation identities', () => {
    recordOpenedConversation('href:/web/conversations/a');
    recordOpenedConversation('href:/web/conversations/a');
    recordOpenedConversation('href:/web/conversations/b');

    expect(peekPreviousConversationIdentity()).toBe('href:/web/conversations/a');
    expect(consumePreviousConversationIdentity()).toBe('href:/web/conversations/a');
    expect(peekPreviousConversationIdentity()).toBeNull();
  });

  it('ignores empty identities', () => {
    recordOpenedConversation(null);
    expect(peekPreviousConversationIdentity()).toBeNull();
  });
});
