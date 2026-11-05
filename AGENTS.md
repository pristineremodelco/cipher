# AGENTS.md

Read by Grok Bot. Claude Code reads CLAUDE.md, which carries the same rules.

## Every session

1. Pull the latest from GitHub (`git fetch`, then compare with
   `origin/main`). Build on what is there. Never force push.
2. Read HANDOFF.md. It says the goal, how far the last session got, why, and
   what is next.
3. Read CLAUDE.md for this repo's house rules. They apply to you too.

## When stopping, finishing, or out of usage

Update HANDOFF.md in the same PR as the work: goal, status, why, next steps,
open questions, branches and PRs, and a dated log line naming the tool (for
example `2026-11-04 Grok Bot: ...`). Write it so the other assistant can
carry on without asking.

## Always

- Work on your own branch and PR. Never edit a branch the other assistant is
  using.
- Every merge to main waits for the owner's explicit OK. Merging can deploy.
- Never commit secrets, personal rule files (`*.mdc`), `.dev.vars`, `.env` files, or
  prompt logs (PROMPT-LOG.md).
- No em dashes in files or commit messages.
- This repository is public. Nothing personal goes in it: no names, emails,
  addresses, accounts, keys or prices, in files or commit messages.
