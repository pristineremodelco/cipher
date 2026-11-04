# Handoff

Short current state for whichever assistant picks this up next. README.md
describes the app itself. This repository is public: nothing personal goes
in this file.

## Goal

A calculator, converter and set of tools that run entirely in the browser.
No ads, no account, no network.

## Status (how far it got)

- Main is at #4 (hashed assets cached for a year, labelled containers get a
  group role). Before that: shorter update banner (#3) and fewer clock wakes
  and fetches (#1).
- Every push to `main` tests, builds and publishes to GitHub Pages.
- A second copy runs on Cloudflare as static files. It only updates when
  someone runs the build and `npx wrangler deploy` by hand. #2 would make
  that automatic.

## Why (decisions and reasons)

- The repository is public, so it holds no personal details, keys or
  prices. PROMPT-LOG.md is ignored for that reason.
- The one allowed dash character is a lone dash standing for an empty value
  in readouts and score sheets. The browser tests expect it.

## Next steps

1. Review #2. It needs two repository secrets set in GitHub before merging,
   or the new workflow fails on the next push to `main`. The steps are in
   the PR description.

## Open questions

- Merge #2, or keep publishing the Cloudflare copy by hand?

## Branches and PRs

- #2 Publish the Cloudflare copy on every push to main,
  `cursor/cloudflare-autodeploy-8a43`. Open.
- `cursor/performance-audit-8a43` and `cursor/update-banner-copy-f442` look
  like leftovers of merged PRs. Check before deleting.

## Log

- 2026-11-04 Claude Code: added HANDOFF.md, AGENTS.md and a shared section
  in CLAUDE.md. No app code changed.
