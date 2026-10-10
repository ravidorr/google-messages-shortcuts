#!/usr/bin/env bash
# Verify a project against the github-project-setup baseline. Usage: verify-baseline.sh [dir] [web|nonweb]
# Exits non-zero if any check fails. Run from Step 6 (completion loop) and in update-mode audits.
set -u
cd "${1:-.}" || exit 2
kind="${2:-nonweb}"
fail=0
check() { if eval "$2" >/dev/null 2>&1; then echo "ok    $1"; else echo "FAIL  $1"; fail=1; fi; }

for f in .editorconfig .npmrc .nvmrc llms.txt AGENT.md CLAUDE.md GEMINI.md CHANGELOG.md CONTRIBUTING.md LICENSE \
  PRIVACY.md README.md SECURITY.md SUPPORT.md TODO.md .husky/pre-commit .husky/pre-push .husky/commit-msg \
  .github/workflows/ci.yml .github/dependabot.yml .github/PULL_REQUEST_TEMPLATE.md eslint.config.mjs \
  .stylelintrc.json .htmlvalidate.json .markdownlint-cli2.jsonc scripts/check-release.mjs; do
  check "file $f" "test -f $f"
done
if [ "$kind" != web ]; then check "no Lighthouse job in CI for non-web" "! grep -q lighthouse .github/workflows/ci.yml && test ! -f lighthouserc.json"; fi
if [ "$kind" = web ]; then for f in robots.txt sitemap.xml lighthouserc.json; do check "file $f" "test -f $f"; done; fi

check "no unfilled placeholders" "! grep -RIl '{{[A-Z_]*}}' . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.github --exclude-dir=.claude"
check ".husky hooks executable" "test -x .husky/pre-commit && test -x .husky/pre-push"
check "pre-push blocks direct pushes to main" "grep -q 'refs/heads/main' .husky/pre-push"
check "pre-push runs coverage" "grep -q 'test:coverage' .husky/pre-push"
check "pre-push runs check-release" "grep -q 'check-release' .husky/pre-push"
check "CI runs coverage" "grep -q 'test:coverage' .github/workflows/ci.yml"
check "CI runs check-release" "grep -q 'check-release' .github/workflows/ci.yml"
check "PR coverage report script + json-summary reporter" "test -f scripts/coverage-summary.mjs && grep -rq 'json-summary' jest.config.* vitest.config.* 2>/dev/null"
check "CI posts coverage to the PR" "grep -q 'coverage-summary' .github/workflows/ci.yml && grep -q 'pull-requests: write' .github/workflows/ci.yml"
check "100% coverage thresholds" "grep -REq '(100)' jest.config.* vitest.config.* 2>/dev/null"
check ".npmrc: registry, save-exact, engine-strict" "grep -q '^registry=' .npmrc && grep -q '^save-exact=true' .npmrc && grep -q '^engine-strict=true' .npmrc"
check ".npmrc: no escape hatches / fund=false / audit=false" "! grep -Eq 'legacy-peer-deps|^force=|strict-ssl=false|ignore-scripts=true|fund=false|audit=false|_authToken=[^\$]' .npmrc"
check "ESLint uses strict preset" "grep -q 'strict' eslint.config.mjs"
check "CLAUDE.md imports AGENT.md" "grep -q '@AGENT.md' CLAUDE.md"
check "llms.txt has description line" "grep -q '^> ' llms.txt"
check "package.json engines + packageManager" "grep -q '\"engines\"' package.json && grep -q '\"packageManager\"' package.json"
check "lint script covers markdown" "grep -q 'markdownlint' package.json"
check ".nvmrc matches engines lower bound" "node -e \"const v=require('fs').readFileSync('.nvmrc','utf8').trim();const e=require('./package.json').engines.node;process.exit(e.includes(v)?0:1)\""
check "default branch is main" "test \"\$(git symbolic-ref --short HEAD)\" = main"
check "design-system present (or documented omission)" "test -d design-system"
if command -v gh >/dev/null 2>&1 && git remote get-url origin >/dev/null 2>&1; then
  slug="$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null)"
  if [ -n "$slug" ]; then
    echo "info  remote $slug visibility: $(gh repo view --json visibility -q .visibility)  (must match what the user chose)"
    check "Dependabot alerts enabled" "gh api -i repos/$slug/vulnerability-alerts | head -1 | grep -q 204"
    check "Dependabot security updates enabled" "test \"\$(gh api repos/$slug/automated-security-fixes -q .enabled)\" = true"
    echo "info  manual check (no API): Malware alerts, Grouped security updates, Automatic dependency submission -> https://github.com/$slug/settings/security_analysis"
    check "remote default branch is main" "test \"\$(gh repo view --json defaultBranchRef -q .defaultBranchRef.name)\" = main"
    if [ "$(gh repo view --json visibility -q .visibility)" = PRIVATE ] && [ -z "$(gh api user -q .plan.name 2>/dev/null)" -o "$(gh api user -q .plan.name 2>/dev/null)" = free ]; then
      echo "info  private repo on a free plan: branch protection is unavailable (known limitation, reported to the user)"
    else
      check "branch protection on main" "gh api repos/$slug/branches/main/protection"
    fi
  fi
fi
exit $fail
