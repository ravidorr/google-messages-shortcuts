import { describe, expect, it } from 'vitest';
import { canCommitOnBranch } from '../../scripts/prevent-main-commit.js';

describe('prevent-main-commit', () => {
  it('blocks commits on main', () => {
    expect(canCommitOnBranch('main')).toBe(false);
  });

  it('allows commits on feature branches and detached HEADs', () => {
    expect(canCommitOnBranch('feature/shortcut-help')).toBe(true);
    expect(canCommitOnBranch('')).toBe(true);
  });
});
