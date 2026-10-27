---
description: Fix PR review comments - pull down GitHub review comments and implement fixes systematically
model: sonnet
---

You are in FIX-REVIEW MODE. Your job is to pull down PR review comments and fix them systematically.

**Usage**: `/fix-review [PR#] [round-N]`
- `round-N` is optional — when provided, only fix comments from that specific review round
- Without a round argument, all unresolved comments are shown

## Getting started

1. If no PR number was provided, ask for one
2. Parse the arguments: check if a `round-N` argument was provided
3. Fetch all review comments (GitHub MCP pull-request tools, owner
   `mdworkin21`, repo `system-cards`)
4. Also fetch the PR details for context on what the PR does
5. Filter to unresolved comments only
6. **If a round was specified**: further filter to comments whose body starts
   with `[Round N]` or that belong to a review whose body starts with
   `## Round N`. Tell the user: "Showing only **Round N** comments."
7. **If no round was specified**: show all unresolved comments grouped by round
   (`[Round N]` prefixes); untagged ones under "Untagged"
8. Present the list, grouped by file, with severity tags and finding labels
   (`[L1-W2]`, `[CRITICAL]`, `[WARN]`, `[SUGGESTION]`)
9. Unless otherwise noted, assume all comments in a PR are to be fixed

## Fixing

**Branch first — commit ON the PR's head branch, never a new one.** From the
PR details, read the head branch (`head.ref`), then `git fetch origin
<head.ref>` and `git checkout <head.ref>`. Do ALL fix commits there. This
overrides CLAUDE.md's "create a descriptively-named branch" rule.

10. Work through fixes one file at a time
11. For each fix: read the file, understand the surrounding context, make the
    change; follow `.claude/skills/code-comments/SKILL.md` for any comment you
    touch
12. **Card comments**: a comment that says a value overstates its quote, or a
    status is wrong, is fixed on the card: change the value or status, and if
    the words cited no longer fit, cite different words on the page (open it:
    `uv run syscards text cache/pdfs/<sha256>.pdf --page N`). Never edit a
    quote to match a value. A comment that says "audited, correct" is not a
    fix: report it to the user; only they set `verified_by` and
    `verification`
13. After each file, briefly explain what you changed and why
14. Follow the phased workflow — pause after each logical group of fixes for
    user review before continuing

## Wrapping up

15. Run the checks: `uv run ruff check . && uv run ruff format --check . &&
    uv run mypy && uv run pytest -q && uv run syscards schema --check &&
    uv run syscards check`; for a data PR with the PDFs cached, `uv run
    syscards check --require-pdfs`; for a site PR, the `site/` checks
16. If all green, push the fixes to the PR's head branch (`git push origin
    <head.ref>`) — NOT a new branch

## Resolving comments

17. After pushing fixes, resolve each addressed comment thread on GitHub
    (GitHub MCP `resolve_review_thread`, or `gh api graphql` with
    `resolveReviewThread`). For each comment that was fixed (or answered if it
    was a question), resolve its thread. If a comment was intentionally NOT
    addressed, leave it unresolved and note which ones were skipped and why.
18. Triple check that you have actually addressed all comments!
