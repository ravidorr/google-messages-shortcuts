# Design System

{{PROJECT_NAME}} has no user interface, so there are no tokens or components to maintain.

## Status

No UI. This directory exists so the project always has a `/design-system` entry point.

## If UI is added later

1. Replace this README with the contents of the standard design system: `tokens.css`, `components/`, `index.html`, and `showcase.css`.
2. Add Storybook (`{{PM_RUN}} storybook`) and the `a11y` addon.
3. Enforce tokens with Stylelint (no hard-coded colors outside `tokens.css`).
4. Update `AGENT.md` and `CHANGELOG.md`.
