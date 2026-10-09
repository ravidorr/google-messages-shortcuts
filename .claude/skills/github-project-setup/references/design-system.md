# Design system (`/design-system`)

Every project with UI has `/design-system` to guarantee consistency. Code is the source of truth; Claude Design is an optional mirror.

## No-UI projects

Libraries, CLIs, and backends still get `design-system/`, containing only the README from `assets/design-system-no-ui/` that states "no UI" and explains how to promote it if UI is added. Skip Storybook, `tokens.css`, the showcase, and the Claude Design offer for these projects.

## Contents (projects with UI)

- `tokens.css`: CSS custom properties for color, spacing, type, radius, shadow; light and dark (`prefers-color-scheme` guarded by `:root:not([data-theme="light"])`, plus `:root[data-theme="dark"]`).
- `components/`: components with Storybook stories (`*.stories.ts`).
- `index.html` + `showcase.css`: static showcase, linted by html-validate.
- `README.md`: rules.

## Enforcement

- Stylelint blocks hex colors outside `tokens.css` and `!important`.
- Accessibility: WCAG 2.1 AA contrast in both themes; verify token pairs.
- Storybook: set up with `<pm> exec storybook init` (choose the matching framework), then add the `a11y` addon.

## Claude Design mirror (offer after scaffolding)

Ask the user. If yes: call the Artifact tool with `action: "quickstart"`, `intent: "other"` (design systems use `other`), then create the design system artifact from `design-system/tokens.css` and the component list. Do not publish without the user's go-ahead; artifacts are private by default but confirm.

Update mode: if `design-system/` exists, never replace tokens; report missing files and propose additions only.
