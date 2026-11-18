# Handoff

Short current state for whichever assistant picks this up next. README.md
describes the app itself. This repository is public: nothing personal goes
in this file.

## Goal

A calculator, converter and set of tools that run entirely in the browser.
No ads, no account, no network.

## Status (how far it got)

- Main (2026-11-18) includes #1 through #12: fewer clock wakes (#1), the
  Cloudflare workflow (#2), the shorter update banner (#3), long cache for
  hashed assets (#4), shared handoff notes (#5), legal pages (#6, #7, #8),
  the thinner favicon mark (#9), the sideloadable Android app (#10) and a
  hyphen instead of an em dash for empty values (#12). #13 adds a Children
  section to the privacy policy.
- Saved history (brief 27) is on branch `claude/project-thread-53tiv9`,
  open as a pull request, not merged. History rows sit under the day they
  were worked out, with the time. Search, Save (kept apart from the 200 and
  left alone by Clear, up to 100), a one line Note, and Delete per row. Still
  stored only in the browser, under `calculator.tape.v1`; old saves load
  unchanged because the two new fields are optional.
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
- Maskable icons keep the glyphs inside the centre circle of diameter 80%
  (the safe zone) and let the espresso tile fill the bleed. The page and
  the manifest put `?v=` on icon addresses so a browser that caches a
  favicon by its URL fetches the new drawing; the service worker ignores
  that parameter and still serves the precached file.
- The Android app loads the public site rather than only the files in the
  APK, because that is the origin the update banner already watches. The
  bundled files are the offline fallback. Release signing is read from
  environment variables or a gitignored `keystore.properties`. No keystore
  is in the repository.

## Next steps

1. Brief 28: themes (a brand palette pair), keyboard keys and a desktop
   layout, as a second pull request.
2. Test the Android app on a phone (sideload a debug build) before a
   release build.
3. Optional later: attach a custom domain on the Worker under Settings,
   then Domains.

## Open questions

- Keep GitHub Pages as a second public copy, or retire it once Cloudflare
  auto-deploy is green?

## Branches and PRs

- #6 privacy, terms, and support pages: merged 2026-11-06.
- #8 removed the Cloudflare account id from this handoff: merged 2026-11-07.
- #9 `cursor/favicon-mark-4180`: new mark, maskable safe zone, icon cache bust.
  Merged 2026-11-16.
- #10 `cursor/android-capacitor-4180`: Capacitor Android app. Merged 2026-11-16.
- #12 `fix/copy`: hyphen for empty values. Merged 2026-11-18.
- #13 `docs/children-privacy`: Children section in the privacy policy and the
  offline copy, effective November 18, 2026.
- `claude/project-thread-53tiv9`: saved history (brief 27). Open, waiting on
  the owner's OK.
- `cursor/performance-audit-8a43` and `cursor/update-banner-copy-f442` look
  like leftovers of merged PRs. Check before deleting.

## Log
- 2026-11-18 Claude Code: saved history (brief 27). The brief file was not
  available, so this works from the request: keep past calculations on the
  device to see and reuse. History already did that; this adds day headings
  with times, search, Save, Note and Delete. Pure functions in
  `src/lib/calctape.ts` with `test/tape.test.ts`; the list is
  `src/components/History.tsx`. Browser checks added to
  `test/browser/behaviour.mjs` but not run here (no browser in the session).
- 2026-11-18 Grok Bot: Children section (not meant for under 13, email to
  delete) in public/privacy.html and the privacy part of public/offline.html,
  effective November 18, 2026. Status, next steps and PR list brought up to
  date. PR #13.
- 2026-11-17 Grok Bot: on #12, added an empty `previews` block to
  `wrangler.jsonc`. The Workers Builds branch check was red because
  `npx wrangler preview` refused to run without that block, after
  `npm run build` had already succeeded. Same failure as #9 and #10.
  Merged with #12 on 2026-11-18.
- 2026-11-17 Grok Bot: the empty-value placeholder is a plain hyphen `-`
  instead of an em dash in the converter, form readouts and game boards
  (brief 05). The pasted em dash to minus conversion in `calc.ts` stays.
  PR #12, merged 2026-11-18.
- 2026-11-16 Cursor: on #10, the offline page says the network cannot be reached and Try again opens the public site.
- 2026-11-16 Cursor: on #10, the offline fallback is one self-contained page with the privacy and terms text in the page.
- 2026-11-16 Cursor: on #10, privacy wording now fits both the website and the Android app. Public and bundled copies match.
- 2026-11-16 Cursor: on #10, turned off Android backup, removed the unused file provider, and set the web view client through the bridge. Privacy text matches the bundled copy.
- 2026-11-16 Cursor: added a Capacitor Android app that opens the public site, falls back to the bundled copy offline, and signs release builds only from the environment or a gitignored properties file.
- 2026-11-16 Cursor: swapped the favicon and app icons to the thinner mark, held the maskable glyphs inside the centre 80% circle, and added `?v=2` so an icon change still trips the update banner and a reload fetches the new drawing.
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
