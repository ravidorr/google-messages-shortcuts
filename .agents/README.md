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

That runs the Modern Web Guidance CLI and refreshes the **`modern-web-guidance`** skill only. The CLI may open an interactive wizard when it cannot detect your agent environment; use `npx modern-web-guidance@latest install --choose` when you need to pick skills explicitly. The **`chrome-extensions`** skill is vendored in this repository (update by re-copying from upstream or selecting it in `--choose`).

To pick skills interactively (for example, reinstall both from upstream):

```bash
npx modern-web-guidance@latest install --choose
```

Select **chrome-extensions** and **modern-web-guidance**.

See [Build extensions with coding agents](https://developer.chrome.com/docs/extensions/ai/build-with-ai) and [AGENT.md](../AGENT.md).
