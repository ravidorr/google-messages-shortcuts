import { describe, expect, it } from 'vitest';
import {
  getPageKeyBindingsForCommand,
  matchesKeyBinding,
  PAGE_KEY_BINDINGS,
  resolvePageCommandFromEvent
} from '../../src/shared/page-keymap.js';
import { PAGE_COMMAND_NEXT_CONVERSATION } from '../../src/shared/page-commands.js';

describe('page-keymap', () => {
  it('matches key bindings and resolves page commands', () => {
    const binding = PAGE_KEY_BINDINGS.find((entry) => entry.command === PAGE_COMMAND_NEXT_CONVERSATION);
    const event = {
      code: binding.code,
      altKey: binding.altKey,
      ctrlKey: Boolean(binding.ctrlKey),
      metaKey: Boolean(binding.metaKey),
      shiftKey: Boolean(binding.shiftKey)
    };

    expect(matchesKeyBinding(event, binding)).toBe(true);
    expect(resolvePageCommandFromEvent(event)).toBe(PAGE_COMMAND_NEXT_CONVERSATION);
    expect(getPageKeyBindingsForCommand(PAGE_COMMAND_NEXT_CONVERSATION)).toHaveLength(1);
  });

  it('returns null when no binding matches', () => {
    expect(resolvePageCommandFromEvent({
      code: 'KeyZ',
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false
    })).toBeNull();
  });
});
