# Handoff

Short current state for whichever assistant picks this up next. README.md
describes the app itself. This repository is public: nothing personal goes
in this file.

## Goal

A calculator, converter and set of tools that run entirely in the browser.
No ads, no account, no network.

## Status (how far it got)

- Main includes #2 (Cloudflare workflow on every push to main), #4 (hashed
  assets cached for a year, labelled containers get a group role), #3
  (shorter update banner), and #1 (fewer clock wakes and fetches).
- Every push to `main` tests, builds and publishes to GitHub Pages at
  https://pristineremodelco.github.io/cipher/.
- The same push also runs the Cloudflare workflow, which builds for the
  root and deploys to https://cipher.pristineremodelco.workers.dev. That
  job needs two repository Actions secrets: `CLOUDFLARE_API_TOKEN` and
  `CLOUDFLARE_ACCOUNT_ID` (secret names only; values live in GitHub Actions
  or the Cloudflare dashboard, never in this public repo).
- As of 2026-11-06 both secrets are set. The Cloudflare workflow on main
  succeeded (tests, build, and `wrangler-action` deploy). Live check the
  same day: workers.dev returned HTTP 200. Pages still publishes in
  parallel.

## Why (decisions and reasons)

- The repository is public, so it holds no personal details, keys,
  prices, or env values (account ids, tokens). Secret *names* are fine;
  values stay in GitHub Actions secrets or the Cloudflare dashboard.
  PROMPT-LOG.md is ignored for that reason.
- The one allowed dash character is a lone dash standing for an empty value
  in readouts and score sheets. The browser tests expect it.

## Next steps

1. Optional later: attach a custom domain on the Worker under Settings,
   then Domains.
2. Merge the open scrub PR that removes any leftover account-id wording
   from this handoff tip once Preston says OK (Watch already passed the
   scrub).

## Open questions

- Keep GitHub Pages as a second public copy, or retire it once Cloudflare
  auto-deploy is green?

## Branches and PRs

- #6 privacy, terms, and support pages: merged 2026-11-06.
- `cursor/performance-audit-8a43` and `cursor/update-banner-copy-f442` look
  like leftovers of merged PRs. Check before deleting.

## Log
- 2026-11-07 Grok Bot: confirmed `CLOUDFLARE_API_TOKEN` and
  `CLOUDFLARE_ACCOUNT_ID` are set as Actions secrets; latest Cloudflare
  workflow on main succeeded and workers.dev returned 200. Updated status
  and next steps. Still no env values in this file.
- 2026-11-06 Grok Bot: scrubbed Cloudflare account id from this handoff; secret names only, dashboard for the id.
- 2026-11-06 Grok Bot: #2 merged. Cloudflare Actions failed (missing
  secrets). Hand-deployed main to cipher.pristineremodelco.workers.dev.
  Updated this handoff. Corrected #6 as merged.
- 2026-11-05 Grok Bot: feat/legal-pages: privacy, terms, support pages and Settings links. Support email pristineremodelco@gmail.com. Later merged as #6.

- 2026-11-04 Claude Code: added HANDOFF.md, AGENTS.md and a shared section
  in CLAUDE.md. No app code changed.
