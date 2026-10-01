# DOM fixture sanitization

Automated tests use sanitized HTML fragments under `test/fixtures/dom/`. Never commit live Google Messages DOM snapshots without scrubbing.

## Required replacements

| Category | Rule |
| -------- | ---- |
| Display names | Replace with `Contact A`, `Group B`, etc. |
| Phone numbers | Replace with `(555) 010-0000` pattern only |
| Email addresses | Replace with `user@example.com` |
| Message snippets | Replace with `Sample message text` |
| Timestamps | Use fixed values (`Jan 1, 2024`) or remove |
| Avatars / media URLs | Remove or use `https://example.com/avatar.png` |
| Account identifiers | Remove; use `data-test-account="fixture"` if an ID is required |

## Structural preservation

Keep these intact when they define behavior under test:

- `data-e2e-*` attributes used by adapters
- Roles and ARIA attributes referenced by selectors (`aria-selected`, `aria-haspopup`, etc.)
- Custom element tag names (`mws-conversation-list-item`, etc.)
- Class names required for fallback menu matching (`.mat-mdc-menu-item`, etc.)

## Review before commit

1. Search fixtures for `@`, `+1`, `(`, seven-digit sequences, and real product names.
2. Run `npm test`; the fixture sanitization test fails if forbidden patterns appear.
3. Prefer minimal markup: include only nodes required for the scenario under test.

## Adding a new fixture

1. Add a named export in `test/fixtures/dom/list-states.js` (or a sibling module for future compose/message fixtures).
2. Document the scenario in a short comment above the export.
3. Reference the fixture from unit tests; do not duplicate large HTML strings in test files when a shared fixture exists.
