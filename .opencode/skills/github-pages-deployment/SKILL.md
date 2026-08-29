---
name: github-pages-deployment
description: Use when configuring, switching, publishing, or diagnosing this Astro site's GitHub Pages deployment, including its custom-domain and project-URL modes.
---

# GitHub Pages Deployment

Keep Astro configuration, the published `CNAME` asset, and the GitHub Pages
API's custom-domain setting as one coupled deployment contract. This site ships
static output only; do not add a runtime backend or client-side publication
workflow.

## Deployment modes

| Mode | Astro `site` | Astro `base` | `public/CNAME` | Pages API `cname` |
| --- | --- | --- | --- | --- |
| Custom domain | `https://riffle.trepka.dev` | unset | present with exactly `riffle.trepka.dev` | `riffle.trepka.dev` |
| Project URL | `https://OWNER.github.io` | `/REPO` | absent | `null` |

For project mode, substitute the repository owner and name; do not leave a
placeholder in the deployed configuration. Never leave a custom-domain CNAME
behind when using project mode, or retain a project `base` when using the root
custom domain. Internal links, asset paths, and canonical URLs must agree with
the selected mode.

## Safe switching and publishing

1. Identify the exact `OWNER/REPO` and inspect current state before changing
   anything:

   ```text
   gh auth status
   gh api repos/OWNER/REPO/pages
   gh run list --limit 5
   ```

2. Change the Astro `site`/`base` pair and `public/CNAME` together. Make the
   desired source state internally consistent before touching the Pages API.
   Build locally with `pnpm check` and `pnpm build`; inspect `dist/` for the
   expected base paths, canonical URLs, and CNAME presence or absence.

3. Set the Pages API domain to the same target, using the repository's actual
   owner and name. For custom mode:

   ```text
   gh api --method PUT repos/OWNER/REPO/pages -f cname=riffle.trepka.dev
   ```

   For project mode, remove the custom domain explicitly:

   ```text
   gh api --method PUT repos/OWNER/REPO/pages -F cname=null
   ```

4. Let the normal Pages workflow publish `dist/`. Inspect the relevant run and
   stop on a failed build rather than changing domain settings to hide it:

   ```text
   gh run list --limit 5
   gh run watch RUN_ID --exit-status
   ```

5. Re-read `gh api repos/OWNER/REPO/pages` and confirm its `cname` matches the
   selected mode. Verify the Actions run, the live root URL, and at least one
   nested issue route in that mode.

## Verification and stale redirects

- Test both root and nested URLs with cache-busted, no-cache GET or HEAD
  requests. Inspect the first response without automatically following
  redirects, then use a followed request only to confirm the final content.
- A repeatable probe is:

  ```text
  curl -sS -D - -o /dev/null -H 'Cache-Control: no-cache' -H 'Pragma: no-cache' 'https://HOST/PATH?pages_probe=UNIQUE_VALUE'
  ```

- An HTTP-to-HTTPS redirect is expected. A redirect from one host to the other
  after the Pages API and cache-busted responses agree is a different problem.
- If fresh requests return `200` but a browser still follows an old permanent
  cross-host redirect, test a private window or another browser and inspect
  browser cache or site data. HSTS only upgrades HTTP to HTTPS on the same host
  and cannot cause a cross-host redirect. Do not change server configuration
  again until the API and cache-busted responses prove that the redirect is
  server-side.
- Confirm generated HTML has stable canonical URLs and correct internal and
  asset paths, while retaining the project's static-output checks. For
  export/schema and issue-content rules, use the `issue-export-contract` skill
  rather than duplicating them here.
