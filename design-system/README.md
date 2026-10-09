# Design System

Single source of truth for popup UI consistency. Code is canonical; Claude Design is an optional mirror.

## Structure

- `tokens.css` - color, spacing, type, and radius tokens
- `components/` - reusable components and their stories
- `index.html` - static showcase of tokens and components

## Rules

- No hard-coded colors, spacing, or font sizes outside `tokens.css`.
- New components use the design tokens and include a story.
- Popup and options UI must meet WCAG 2.1 AA contrast in light and dark themes.
- Changing a token is a visible change and requires a `CHANGELOG.md` update.

## Storybook

```bash
npm run storybook
npm run build-storybook
```
