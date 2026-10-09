# .npmrc and .nvmrc rules

## .npmrc

Only checked-in, reproducible package-manager behavior. Credentials and personal or machine-specific settings belong in `~/.npmrc` or CI secrets.

- Never commit tokens, passwords, `_auth`, or certificates.
- Scope credentials to the exact registry host and path. Never an unscoped `_authToken`.
- Inject `NPM_TOKEN` from CI secrets or env: `//npm.acme.example/:_authToken=${NPM_TOKEN}`.
- Private scope example: `@acme:registry=https://npm.acme.example/`.
- `save-exact=true` is optional but is the default here. A committed lockfile pins the full graph.
- `engine-strict=true` is only useful if `engines` is accurate.
- Keep the lockfile committed. Never `package-lock=false` for an application.
- Forbidden escape hatches: `legacy-peer-deps=true`, `force=true`, `strict-ssl=false`, `ignore-scripts=true`.
- Do not set `audit=false` or `fund=false` globally without a documented reason. Run audits in CI.

## .nvmrc

One exact Node version, no comments:

```text
22.14.0
```

- Pin exact patch, prefer an active LTS (look it up, do not rely on memory).
- Align with `engines.node`, CI (`node-version-file: .nvmrc`), and container images.
- Never `node`, `current`, or `lts/*`.
- Do not use it to pin npm: use `packageManager` in `package.json`.
- Libraries supporting multiple majors: `.nvmrc` = primary dev version; test the matrix in CI.
