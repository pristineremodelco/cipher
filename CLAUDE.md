# Cipher

A calculator, converter and set of tools that run entirely in the browser.
README.md describes it.

## Shared with Grok Bot

Grok Bot also works in this repo and reads AGENTS.md, which carries the same
rules. Before starting, pull the latest from GitHub and read HANDOFF.md. When
stopping or running low on usage, update HANDOFF.md in the same PR: goal,
status, why, next steps, open questions, branches and PRs, and a dated log
line naming the tool. Work on your own branch, never one Grok Bot is using.
Every merge to main waits for the owner's OK. Never commit secrets, personal rule files (`*.mdc`), `.dev.vars` or prompt logs. No em
dashes in files or commits.

## This repository is public

- Nothing personal goes in it: no names, emails, addresses, accounts, keys,
  prices or client details, in files or in commit messages.
- PROMPT-LOG.md (a hook writes it into every project folder) is ignored here
  for that reason. Check `git status` before every commit anyway.

## Shipping

- Every push to `main` runs the tests, builds and publishes to GitHub Pages.
  Unfinished work stays on a branch.
- A second copy runs on Cloudflare as static files, set up in
  `wrangler.jsonc`. It does not update on push: run `npm run build` without
  BASE_PATH, then `npx wrangler deploy`, after the push.
- Before starting, `git fetch` and compare with `origin/main`. A session on
  the phone or in the cloud may have pushed. Build on it; never force push.
- Before pushing: `npm run lint`, `npm test`, `npm run build`.

## House rules

- No em dashes in anything written for the project: interface text,
  comments, docs, commit messages. Check with
  `git grep -n "$(printf '\342\200\224')"` before committing. The one
  exception is a lone dash standing for an empty value in the converter and
  tool readouts and the game score sheets; the browser tests expect it.
- Interface copy says what a control does. Why it was built that way goes in
  commit messages and code comments, never on screen.
- Verify before claiming. Say what was tested and how, and what was not.
