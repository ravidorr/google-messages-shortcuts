# Contributing

Thanks for contributing to Messages Shortcut Actions.

## Development setup

1. Fork the repository and create a branch from `main`.
2. Install dependencies with `npm install`.
3. Run `npm run build` to create the loadable extension in `dist/`.
4. Load `dist/` from `chrome://extensions` with Developer mode enabled.

## Before opening a pull request

1. Run `npm run lint`.
2. Run `npm test`.
3. Add or update tests for code changes.
4. Add an entry to `CHANGELOG.md`.
5. Bump and synchronize the versions in `package.json`, `manifest.json`, and `package-lock.json`.
6. Stage `package.json`. The pre-commit hook stages all of its changes, runs `npm install`, and stages the rebuilt `package-lock.json`.
7. Run `npm run verify:version-bump`.
8. Keep each pull request focused on one change.

## Pull requests

Do not commit directly to `main`. Create a branch, push it, and open a pull request. The repository checks coverage for every pull request and posts the current report as a comment.

Please explain the change, include how it was tested, and update documentation when user-facing behavior changes.

## Reporting bugs and requesting features

Use the provided GitHub issue templates for reproducible bugs and feature requests. For security vulnerabilities, follow [SECURITY.md](SECURITY.md).
