# Chrome Web Store publishing

## Goal

Publish a packaged extension release to the Chrome Web Store only after a pull
request has merged into `main`. The release submits to Chrome's normal review
process and becomes available to all users after approval.

## Trigger and source

The workflow runs for the `pull_request` closed event. Its publish job runs
only when the pull request was merged and its base branch is `main`. It checks
out the resulting commit on `main`, so the uploaded package matches the code
that GitHub merged regardless of whether the pull request used merge, squash,
or rebase merging.

Direct pushes to `main` do not trigger a publication.

## Authentication and configuration

GitHub Actions authenticates to Google Cloud through Workload Identity
Federation. The workflow receives a short-lived access token by impersonating
the dedicated Chrome Web Store publishing service account. No Google private
key is stored in GitHub.

Repository variables provide these deployment identifiers:

- Chrome Web Store publisher ID
- Chrome Web Store extension ID
- Google Workload Identity Provider resource name
- Google service-account email

The workflow requests only `contents: read` and `id-token: write` permissions.
Every external GitHub Action is pinned to an immutable commit SHA.

## Publication flow

The job installs dependencies and runs the existing package command to create
`release/google-messages-shortcuts.zip`. It exchanges the GitHub OIDC token
for a Google access token with the Chrome Web Store API scope, then uploads
the ZIP through Chrome Web Store API v2.

If Chrome reports that an upload is still processing, the workflow polls its
status until the upload completes or fails. After a completed upload, it calls
the publish endpoint with normal review and default publication. It does not
request review bypass. Chrome releases the approved revision to all users.

## Failure handling and tests

The job fails without publishing if authentication, packaging, upload, status
polling, or publication fails. Chrome API warnings block publication.

Workflow tests verify the merged-PR trigger, least-privilege permissions,
SHA-pinned actions, and publication safeguards. The repository's lint, full
coverage suite, build, package, and version validation remain required.
