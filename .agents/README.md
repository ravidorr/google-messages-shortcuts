# Agent skills (Modern Web Guidance)

This directory holds [Modern Web Guidance](https://github.com/GoogleChrome/modern-web-guidance) skills for AI coding agents working on this Chrome extension.

| Skill | Purpose |
| --- | --- |
| `chrome-extensions` | Manifest V3 patterns, permissions, store submission, and `CHROMEWEBSTORE.md` maintenance |
| `modern-web-guidance` | Web platform best practices (performance, accessibility, CSS, and related guides) |

## Install or update

From the repository root:

```bash
./scripts/install-agent-skills.sh
```

That runs the Modern Web Guidance CLI (non-interactive in Cursor) and refreshes `modern-web-guidance`. The `chrome-extensions` skill is tracked in this repository.

To pick skills interactively (for example, reinstall both from upstream):

```bash
npx modern-web-guidance@latest install --choose
```

Select **chrome-extensions** and **modern-web-guidance**.

See [Build extensions with coding agents](https://developer.chrome.com/docs/extensions/ai/build-with-ai) and [AGENT.md](../AGENT.md).
