# Contributing

Thanks for contributing to Messages Shortcut Actions.

## Development setup

1. Fork the repository and create a branch from `main`.
2. Run `nvm install && nvm use`, then install dependencies with `npm install`.
3. Run `npm run build` to create the loadable extension in `dist/`.
4. Load `dist/` from `chrome://extensions` with Developer mode enabled.
5. Optional for AI-assisted work: run `./scripts/install-agent-skills.sh` for the `modern-web-guidance` skill, reload Chrome DevTools MCP from [.cursor/mcp.json](.cursor/mcp.json) in Cursor, and see [AGENT.md](AGENT.md).

## Documentation map

- [ROADMAP.md](ROADMAP.md): phase plan and what ships next
- [docs/product-principles.md](docs/product-principles.md): scope, shortcut model, and launch gates
- [docs/feature-backlog.md](docs/feature-backlog.md): prioritized ideas with impact/difficulty scores
- [docs/architecture.md](docs/architecture.md): module map and testing expectations
- [docs/dom-discovery/](docs/dom-discovery/): live validation, compatibility matrix, and action gates
- [CHROMEWEBSTORE.md](CHROMEWEBSTORE.md): Chrome Web Store listing and permission justifications (update when manifest or store copy changes)

## Before opening a pull request

1. Run `npm run lint`, `npm run typecheck`, and `npm run test:coverage`.
2. Add or update tests for code changes.
3. When `src/`, `package.json`, or `tsconfig.json` changes, add a `CHANGELOG.md` entry and make one SemVer version bump.
4. Keep each pull request focused on one change.
5. Use the tokens and components in `design-system/` for UI changes.

## Pull requests

Do not commit directly to `main`. Create a branch, push it, and open a draft pull request that references its GitHub issue with `Closes #<issue>`. The repository checks coverage for every pull request and posts the current report as a comment.

Please explain the change, include how it was tested, and update documentation when user-facing behavior changes.

## Release policy

When a pull request or push to `main` changes `package.json`, `tsconfig.json`, or files under `src/`, CI requires a SemVer increase and a non-empty matching `CHANGELOG.md` section. Documentation, test, workflow, and tooling-only changes do not need a version bump.

## Reporting bugs and requesting features

Use the provided GitHub issue templates for reproducible bugs and feature requests. For security vulnerabilities, follow [SECURITY.md](SECURITY.md).
