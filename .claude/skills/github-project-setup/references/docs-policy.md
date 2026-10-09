# Docs and agent files

- `AGENT.md` is canonical. `CLAUDE.md` imports it with `@AGENT.md`; `GEMINI.md` links to it. Never duplicate content in the stubs.
- `README.md`: purpose, quickstart, scripts, links to all docs. No section for things the code shows.
- `CHANGELOG.md`: Keep a Changelog format, one entry per released version; `scripts/check-release.mjs` expects `## [x.y.z]` headings.
- `CONTRIBUTING.md`: setup, workflow, standards. Mirrors the commit and PR rules from AGENT.md.
- `SECURITY.md`: supported versions and private reporting path. Needs a real contact.
- `PRIVACY.md`: must be factual. Ask what data is collected and which third parties are involved; never invent. For extensions, list every permission.
- `SUPPORT.md`: where to ask, troubleshooting.
- `TODO.md`: open work; keep it current.
- `llms.txt`: curated agent index; links must resolve.

Markdown linting (markdownlint-cli2) applies to all of these; `CHANGELOG.md` is ignored by default for heading-duplication reasons.
