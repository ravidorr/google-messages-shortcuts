#!/usr/bin/env sh
set -eu

# Installs or refreshes the modern-web-guidance skill from Google Chrome's pack.
# chrome-extensions is vendored under .agents/skills/chrome-extensions.
exec npx modern-web-guidance@latest install "$@"
