# Web-only files: sitemap, robots, llms, Lighthouse

## sitemap.xml (public sites only)

- Published at `https://example.com/sitemap.xml`, UTF-8 XML, absolute canonical HTTPS URLs only.
- Include only URLs that return 200, are indexable, and match their canonical.
- Exclude redirects, 404s, `noindex`, authenticated pages, duplicates, tracking params, internal search/filter combos.
- `<lastmod>` only when it reflects a significant change; omit if you cannot compute it reliably. No `<changefreq>` or `<priority>` (Google ignores them).
- Reference it in `robots.txt`; submit it to Search Console.
- Generate from routes or content source and validate in CI. Split at 50,000 URLs or 50 MB with a sitemap index.
- Do not add `llms.txt` just for discovery; sitemap is for canonical human-facing pages, `llms.txt` is a curated agent index.

## robots.txt

Allow crawling by default and reference the absolute sitemap URL. For private, staging, or authenticated sites use `Disallow: /` instead and omit the sitemap.

## llms.txt

Curated agent index of project docs. Keep links pointing at files that exist (update paths if docs move).

## lighthouserc.json

- Audit the production build, never the dev server. Cover each page template (home, docs, search, product, checkout).
- 3 to 5 runs per URL. Start from `lighthouse:recommended`.
- Accessibility and SEO score 1 as errors once the baseline is clean; performance and best-practices start as warnings, then promote deliberately.
- Static sites: `staticDistDir`. Servers: `startServerCommand`.
- Upload to the filesystem and attach as a CI artifact. Never use `temporary-public-storage` for private, staging, authenticated, or sensitive pages.
- Add every real page URL to `collect.url` when you add the page.
