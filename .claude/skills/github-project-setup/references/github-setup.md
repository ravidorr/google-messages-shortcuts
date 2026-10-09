# GitHub remote setup (confirm with the user before running)

0. Default branch must be `main`: confirm with `git symbolic-ref --short HEAD` before pushing; after creation confirm `gh repo view --json defaultBranchRef -q .defaultBranchRef.name` prints `main`, otherwise `gh repo edit --default-branch main`.
1. Verify auth and owner access: `gh auth status` (the active account must have the `repo` scope, add `read:org` for orgs). Use the owner the user named in Step 1; never infer it. List orgs with `gh api user/orgs -q '.[].login'`. For an org, check `gh api orgs/<org>/memberships/<login> -q .role` and, if creation fails with 403, the org may restrict repo creation to owners: report it and ask for a different owner or for the user to get permission. If the user has several `gh` accounts, switch with `gh auth switch`.
2. Create the repo with the chosen visibility (`--private` or `--public`, always asked, no default) using GitHub's own first commit, never a push to `main`: `gh repo create <owner>/<name> --<private|public> --add-readme --description "<desc>"`. Then work on `chore/project-baseline`, push that branch, and open a draft PR. Never `git push origin main`.
3. Topics: `gh repo edit --add-topic <t1>,<t2>`.
4. Dependabot and security settings (Settings > Advanced Security). Target state: Dependency graph On, Automatic dependency submission Enabled, Dependabot alerts On, Malware alerts On, Dependabot security updates On, Grouped security updates On, Dependabot version updates via `.github/dependabot.yml`.
   Enable what the API supports, then verify each one:
   ```bash
   gh api -X PUT repos/<owner>/<name>/vulnerability-alerts                 # Dependabot alerts
   gh api -X PUT repos/<owner>/<name>/automated-security-fixes             # Dependabot security updates
   gh api -X PUT repos/<owner>/<name>/private-vulnerability-reporting      # private reporting (public repos; may 404 on private)
   gh api -i repos/<owner>/<name>/vulnerability-alerts | head -1           # expect HTTP 204
   gh api repos/<owner>/<name>/automated-security-fixes -q .enabled        # expect true
   gh api repos/<owner>/<name>/dependency-graph/sbom -q .sbom.name         # dependency graph on when this returns a name
   ```
   Version updates come from the checked-in `dependabot.yml` (already templated).
   No REST endpoint exists for Malware alerts, Grouped security updates, or Automatic dependency submission (the dependency-submission endpoint returns 404). Do not pretend to set them: list them in the final report as a manual checklist with the link `https://github.com/<owner>/<name>/settings/security_analysis`, and confirm with the user (or a screenshot) that they are On. New repos usually have them On by default; the 2026-10-09 test repo showed all of them On.
5. Wait for the first CI run: `gh run watch`. Check job names with `gh run view --json jobs -q '.jobs[].name'`.
6. Branch protection on `main` (after CI job names exist), with required checks `quality` (and `lighthouse` for web):

```bash
gh api -X PUT repos/<owner>/<name>/branches/main/protection --input - <<'JSON'
{
  "required_status_checks": { "strict": true, "contexts": ["quality"] },
  "enforce_admins": false,
  "required_pull_request_reviews": { "required_approving_review_count": 1 },
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
```

Verify: `gh api repos/<owner>/<name>/branches/main/protection -q .required_status_checks.contexts` must print `["quality"]` (plus `lighthouse` for web).

Fallback if the classic API returns 403 (private repo on a free plan) or you prefer rulesets:

```bash
gh api -X POST repos/<owner>/<name>/rulesets --input - <<'JSON'
{
  "name": "protect-main",
  "target": "branch",
  "enforcement": "active",
  "conditions": { "ref_name": { "include": ["refs/heads/main"], "exclude": [] } },
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    { "type": "required_linear_history" },
    { "type": "pull_request", "parameters": { "required_approving_review_count": 1, "dismiss_stale_reviews_on_push": false, "require_code_owner_review": false, "require_last_push_approval": false, "required_review_thread_resolution": false } },
    { "type": "required_status_checks", "parameters": { "strict_required_status_checks_policy": true, "required_status_checks": [ { "context": "quality" } ] } }
  ]
}
JSON
```

If both are refused, report the exact error and the manual path (Settings > Branches > Add rule). Do not silently skip.

Note: with required PR review and a solo maintainer, the owner cannot approve their own PR; either set `required_approving_review_count` to 0 for solo repos (ask the user) or leave `enforce_admins` false so the owner can merge.

PRs created later: always drafts (`gh pr create --draft`), title `<JIRA-KEY> - <ticket title>`.


Observed (2026-10-09): a private repo under a free personal account returns 403 "Upgrade to GitHub Pro or make this repository public to enable this feature." for both the classic protection API and rulesets. Do not make a repo public to work around it without the user's explicit yes.
