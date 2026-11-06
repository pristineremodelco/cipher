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
  `CLOUDFLARE_ACCOUNT_ID`. Until both exist the Cloudflare job fails, and
  Pages is unaffected. As of 2026-11-06 the secrets were still missing, so
  the first post-merge Cloudflare run failed. The Worker was brought up to
  date with a hand `wrangler deploy` from main the same morning.

## Why (decisions and reasons)

- The repository is public, so it holds no personal details, keys or
  prices. PROMPT-LOG.md is ignored for that reason.
- The one allowed dash character is a lone dash standing for an empty value
  in readouts and score sheets. The browser tests expect it.

## Next steps

1. Preston adds `CLOUDFLARE_API_TOKEN` (Edit Cloudflare Workers token) and
   `CLOUDFLARE_ACCOUNT_ID` (`32906174d073aa408f9938fdbbac5b69`) as Actions
   secrets on this repo, then re-runs the failed Cloudflare workflow (or
   pushes any commit to main).
2. After the secrets are in, confirm both Pages and Cloudflare succeed on
   the same push.
3. Optional later: attach a custom domain on the Worker under Settings,
   then Domains.

## Open questions

- Keep GitHub Pages as a second public copy, or retire it once Cloudflare
  auto-deploy is green?

## Branches and PRs

- `feat/legal-pages`: privacy, terms, support pages. Open for review.
- `cursor/performance-audit-8a43` and `cursor/update-banner-copy-f442` look
  like leftovers of merged PRs. Check before deleting.

## Log
- 2026-11-06 Grok Bot: #2 merged. Cloudflare Actions failed (missing
  secrets). Hand-deployed main to cipher.pristineremodelco.workers.dev.
  Updated this handoff.
- 2026-11-05 Grok Bot: feat/legal-pages: privacy, terms, support pages and Settings links. Support email pristineremodelco@gmail.com. PR not merged.

- 2026-11-04 Claude Code: added HANDOFF.md, AGENTS.md and a shared section
  in CLAUDE.md. No app code changed.