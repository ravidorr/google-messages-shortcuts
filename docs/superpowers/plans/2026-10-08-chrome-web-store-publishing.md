# Chrome Web Store Publishing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the packaged extension to the Chrome Web Store after a pull request merges into `main`.

**Architecture:** A dedicated GitHub Actions workflow responds to merged pull requests targeting `main`. It obtains a short-lived Chrome Web Store API token through GitHub OIDC and Google Workload Identity Federation, packages the extension, uploads it, polls asynchronous upload status, then submits the completed revision for normal Chrome review and default publication.

**Tech Stack:** GitHub Actions, Google Workload Identity Federation, Google GitHub Actions Auth, Chrome Web Store API v2, Node.js, Vitest, YAML.

## Global Constraints

- Trigger only for merged pull requests whose base branch is `main`, never for direct pushes.
- Request only `contents: read` and `id-token: write` GitHub permissions.
- Use repository variables `CWS_PUBLISHER_ID`, `CWS_EXTENSION_ID`, `GCP_WORKLOAD_IDENTITY_PROVIDER`, and `GCP_SERVICE_ACCOUNT`; do not store a Google private key.
- Pin every external GitHub Action to a 40-character immutable commit SHA with a version comment.
- Use normal Chrome review, `DEFAULT_PUBLISH`, `skipReview: false`, and `blockOnWarnings: true`.
- Fail before publication when authentication, package generation, upload, upload polling, or Chrome API validation fails.

---

### Task 1: Add workflow contract coverage

**Files:**

- Modify: `test/unit/workflows.test.js:90-130`
- Create: `.github/workflows/publish-chrome-web-store.yml`

**Interfaces:**

- Consumes: workflow files from `.github/workflows/`.
- Produces: an executable workflow contract enforced by the Vitest suite.

- [x] **Step 1: Write the failing workflow contract test**

Add this test inside the existing `describe('GitHub workflow security', ...)` block:

```js
  it('publishes only merged main pull requests through OIDC', async () => {
    const workflows = await readWorkflowFiles();
    const publishWorkflow = workflows.find(({ name }) => name === 'publish-chrome-web-store.yml');

    expect(publishWorkflow?.content).toContain('pull_request:');
    expect(publishWorkflow?.content).toContain('types: [closed]');
    expect(publishWorkflow?.content).toContain(
      "github.event.pull_request.merged == true && github.event.pull_request.base.ref == 'main'"
    );
    expect(publishWorkflow?.content).toContain('contents: read');
    expect(publishWorkflow?.content).toContain('id-token: write');
    expect(publishWorkflow?.content).toContain('GCP_WORKLOAD_IDENTITY_PROVIDER');
    expect(publishWorkflow?.content).toContain('GCP_SERVICE_ACCOUNT');
    expect(publishWorkflow?.content).toContain('CWS_PUBLISHER_ID');
    expect(publishWorkflow?.content).toContain('CWS_EXTENSION_ID');
    expect(publishWorkflow?.content).toContain('"publishType":"DEFAULT_PUBLISH"');
    expect(publishWorkflow?.content).toContain('"skipReview":false');
    expect(publishWorkflow?.content).toContain('"blockOnWarnings":true');
  });
```

- [x] **Step 2: Run the focused test to verify it fails**

Run:

```bash
npx vitest run test/unit/workflows.test.js
```

Expected: FAIL because `publish-chrome-web-store.yml` does not exist.

- [x] **Step 3: Create the publishing workflow**

Create `.github/workflows/publish-chrome-web-store.yml`:

```yaml
name: Publish Chrome Web Store

on:
  pull_request:
    types: [closed]

permissions:
  contents: read
  id-token: write

concurrency:
  group: chrome-web-store-publish
  cancel-in-progress: false

jobs:
  publish:
    if: github.event.pull_request.merged == true && github.event.pull_request.base.ref == 'main'
    name: Publish approved Chrome Web Store release
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run package
      - id: auth
        uses: google-github-actions/auth@7c6bc770dae815cd3e89ee6cdf493a5fab2cc093 # v3
        with:
          workload_identity_provider: ${{ vars.GCP_WORKLOAD_IDENTITY_PROVIDER }}
          service_account: ${{ vars.GCP_SERVICE_ACCOUNT }}
          token_format: access_token
          access_token_scopes: https://www.googleapis.com/auth/chromewebstore
      - name: Upload package
        env:
          ACCESS_TOKEN: ${{ steps.auth.outputs.access_token }}
          EXTENSION_ID: ${{ vars.CWS_EXTENSION_ID }}
          PUBLISHER_ID: ${{ vars.CWS_PUBLISHER_ID }}
        run: |
          set -euo pipefail
          item_name="publishers/${PUBLISHER_ID}/items/${EXTENSION_ID}"
          curl --fail-with-body --silent --show-error --request POST \
            --header "Authorization: Bearer ${ACCESS_TOKEN}" \
            --upload-file release/google-messages-shortcuts.zip \
            "https://chromewebstore.googleapis.com/upload/v2/${item_name}:upload" \
            --output upload.json
          upload_state="$(jq -r '.uploadState // empty' upload.json)"
          if [ "${upload_state}" = "SUCCEEDED" ]; then
            exit 0
          fi
          if [ "${upload_state}" != "IN_PROGRESS" ]; then
            cat upload.json
            exit 1
          fi
          for attempt in $(seq 1 30); do
            sleep 10
            curl --fail-with-body --silent --show-error \
              --header "Authorization: Bearer ${ACCESS_TOKEN}" \
              "https://chromewebstore.googleapis.com/v2/${item_name}:fetchStatus" \
              --output upload-status.json
            upload_state="$(jq -r '.lastAsyncUploadState // empty' upload-status.json)"
            if [ "${upload_state}" = "SUCCEEDED" ]; then
              exit 0
            fi
            if [ "${upload_state}" != "IN_PROGRESS" ]; then
              cat upload-status.json
              exit 1
            fi
          done
          echo "Chrome Web Store upload did not finish within five minutes."
          exit 1
      - name: Submit release for review and publication
        env:
          ACCESS_TOKEN: ${{ steps.auth.outputs.access_token }}
          EXTENSION_ID: ${{ vars.CWS_EXTENSION_ID }}
          PUBLISHER_ID: ${{ vars.CWS_PUBLISHER_ID }}
        run: |
          set -euo pipefail
          item_name="publishers/${PUBLISHER_ID}/items/${EXTENSION_ID}"
          curl --fail-with-body --silent --show-error --request POST \
            --header "Authorization: Bearer ${ACCESS_TOKEN}" \
            --header "Content-Type: application/json" \
            --data '{"publishType":"DEFAULT_PUBLISH","skipReview":false,"blockOnWarnings":true}' \
            "https://chromewebstore.googleapis.com/v2/${item_name}:publish"
```

- [x] **Step 4: Run the focused test to verify it passes**

Run:

```bash
npx vitest run test/unit/workflows.test.js
```

Expected: PASS with the workflow contract and immutable-action tests passing.

- [x] **Step 5: Commit the task**

```bash
git add .github/workflows/publish-chrome-web-store.yml test/unit/workflows.test.js
git commit -m "feat: publish merged releases to Chrome Web Store"
```

### Task 2: Document deployment configuration

**Files:**

- Modify: `README.md:175-190`
- Modify: `docs/superpowers/plans/2026-10-08-chrome-web-store-publishing.md`

**Interfaces:**

- Consumes: repository-variable names from the workflow in Task 1.
- Produces: setup instructions that do not expose private credentials.

- [x] **Step 1: Add Chrome Web Store publishing documentation**

Add a `## Chrome Web Store publishing` section after the Development section in
`README.md`:

```markdown
## Chrome Web Store publishing

After a pull request merges into `main`, GitHub Actions packages the extension
and submits it to the Chrome Web Store for review. Chrome publishes the
approved revision to all users.

The workflow uses GitHub OIDC and Google Workload Identity Federation. Configure
these repository variables before merging a release pull request:

- `CWS_PUBLISHER_ID`
- `CWS_EXTENSION_ID`
- `GCP_WORKLOAD_IDENTITY_PROVIDER`
- `GCP_SERVICE_ACCOUNT`

The workflow requires no Google service-account key in GitHub. Follow the
[Chrome Web Store API service-account guide](https://developer.chrome.com/docs/webstore/service-accounts)
to link the Google service account to the Chrome Web Store publisher.
```

- [x] **Step 2: Configure the repository variables**

Run:

```bash
gh variable set CWS_PUBLISHER_ID --repo ravidorr/google-messages-shortcuts --body "a167bb65-c81f-44c1-adf9-0217f87e162b"
gh variable set CWS_EXTENSION_ID --repo ravidorr/google-messages-shortcuts --body "dhdkppijmdfhgmbedgimkgenbmfhldjn"
gh variable set GCP_WORKLOAD_IDENTITY_PROVIDER --repo ravidorr/google-messages-shortcuts --body "projects/624640566757/locations/global/workloadIdentityPools/github-actions/providers/github"
gh variable set GCP_SERVICE_ACCOUNT --repo ravidorr/google-messages-shortcuts --body "chrome-web-store-publisher@shortcuts-for-messages.iam.gserviceaccount.com"
```

Expected: each command completes without error. The values are repository
variables rather than secrets because they identify resources but do not grant
access without the repository-restricted OIDC trust policy.

- [x] **Step 3: Run Markdown lint**

Run:

```bash
npm run lint:md
```

Expected: PASS with no Markdown lint errors.

- [x] **Step 4: Update the plan checklist**

Mark every completed checkbox in
`docs/superpowers/plans/2026-10-08-chrome-web-store-publishing.md` as complete.

- [x] **Step 5: Commit the task**

```bash
git add README.md docs/superpowers/plans/2026-10-08-chrome-web-store-publishing.md
git commit -m "docs: explain store publishing configuration"
```

### Task 3: Verify the complete release path

**Files:**

- Verify: `.github/workflows/publish-chrome-web-store.yml`
- Verify: `test/unit/workflows.test.js`
- Verify: `README.md`

**Interfaces:**

- Consumes: completed Tasks 1 and 2.
- Produces: a verified, review-ready publishing workflow.

- [ ] **Step 1: Run all repository safeguards**

Run:

```bash
npm run lint
npm test
npm run build
npm run package
npm run verify:version-bump
npm run validate:security-policy
```

Expected: lint passes, tests meet 100% coverage, package creation succeeds, and
both release metadata and supported security version validations pass.

- [ ] **Step 2: Inspect the final change set**

Run:

```bash
git diff origin/main...HEAD --check
git status --short --branch
```

Expected: no whitespace errors and only the planned publishing-workflow,
documentation, test, and release metadata changes.

- [ ] **Step 3: Push the feature branch and open a draft pull request**

Run:

```bash
git push --set-upstream origin feat/chrome-web-store-publishing
gh pr create --draft --base main --title "feat: publish merged releases to Chrome Web Store" --body "## Summary
- publish packaged releases only after a pull request merges into main
- authenticate with GitHub OIDC and Google Workload Identity Federation
- submit to normal Chrome review with default publication

## Test plan
- npm run lint
- npm test
- npm run build
- npm run package
- npm run verify:version-bump
- npm run validate:security-policy"
```

Expected: a draft pull request that contains the complete, focused workflow.
