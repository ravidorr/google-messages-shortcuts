# Project kinds

## Web app / static site
Everything in the always-set plus `robots.txt`, `sitemap.xml` (if public), `lighthouserc.json`, the Lighthouse CI job. Framework: ask; Vite + TypeScript is the default for plain web. Set `SITE_URL`. Storybook via `@storybook/html-vite` or the framework package.

## Chrome extension (Manifest V3)
- Skip `robots.txt`, `sitemap.xml`, Lighthouse (delete the Lighthouse job in `ci.yml`).
- Add `manifest.json` (`manifest_version: 3`, minimal permissions, no remote code, explicit `content_security_policy` only if needed), `src/background`, `src/popup` or `options` as needed.
- Build with Vite (`@crxjs/vite-plugin`) or plain `tsc` + copy; add a `zip` script for Chrome Web Store upload.
- `PRIVACY.md` must be accurate: list every permission and what data it touches (required for store review).
- Design system covers popup/options UI. html-validate applies to popup/options HTML.
- Add `chrome-types` dev dependency and the `webextensions` ESLint globals.

## Node library / package
- Skip all web/SEO files. Add `exports`, `types`, `files`, `sideEffects`, build via `tsup` or `tsc`, `publishConfig`, `release.yml` publishing with provenance (`npm publish --provenance`, `NPM_TOKEN` secret, `id-token: write`).
- Design system: full one if the library ships UI; otherwise the no-UI README (`assets/design-system-no-ui/README.md`).
- Multi-Node support: matrix in CI, `.nvmrc` = primary dev version.

## CLI / backend service
- Skip web/SEO files. CLI: `bin` field, shebang, `commander` or `node:util.parseArgs`. Service: `Dockerfile`, health endpoint, `.env.example`.
- Design system: no-UI README unless there is a UI.

## Other stacks
Ask the language and toolchain. Keep language-neutral files and replace JS tooling with the ecosystem equivalents (ruff/mypy, golangci-lint, etc.), still including Markdown linting.
