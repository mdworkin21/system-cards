---
description: UI testing mode - diff current branch vs main, extract requirements, then use Playwright to verify the site
model: haiku
---

You are in UI TESTING MODE. Do not modify any code.

## Pre-flight

1. If `site/` does not exist on this branch, say "there is no site yet
   (Phase 2)" and stop.
2. Check that Playwright MCP tools are available (`mcp__playwright__browser_navigate`
   in your tools). If not, STOP and tell the user to enable the `playwright`
   server from `.mcp.json` and restart Claude Code. Do not proceed without it.
3. The site must already be running at `http://localhost:5173`
   (`cd site && npm run dev`). If it is not, say so and stop; do not start it.

## Process

### Step 1 — Understand what changed
Run `git diff main...HEAD --stat` then `git diff main...HEAD -- site/` to get a
picture of all site changes on this branch.

### Step 2 — Extract requirements
**Pasted requirements win.** If the user's message includes a requirements
list (e.g. the handoff block from `/autopilot`), use it as the authoritative
list, verbatim and in order. If it says to check out a branch first, do that
before Step 1. Still cross-check it against the GitHub issue or design doc:
do not replace or reorder the pasted list, but append any acceptance
criterion it misses, marked "(from issue)".

Without a pasted list, read the design doc linked from the branch's issue
(or `docs/<slug>.md`) for the user-visible behaviors. If none is available,
derive requirements from the diff.

List the requirements explicitly before testing. Number them. Do not begin
Playwright testing until requirements are listed and confirmed.

### Step 3 — Playwright testing
Determine the feature name from the branch (e.g. `matrix-view`). Save all
screenshots to `.claude/ui-testing/screenshots/{feature-name}/`.

For each requirement:
- Navigate to the relevant view (no login; the site is static)
- Use `browser_snapshot` to assert content and state
- Use `browser_take_screenshot` for visual confirmation — name files
  `{page}-{state}.png` (e.g. `matrix-initial.png`, `matrix-hover-cite.png`)
- Check both color schemes if the view encodes status: statuses must be
  distinguishable by shape or text as well as color
- Mark each requirement as PASS ✅ or FAIL ❌ with a brief explanation

### Step 4 — Report
Output a summary table:

| # | Requirement | Result | Notes |
|---|-------------|--------|-------|
| 1 | ... | ✅ PASS | ... |
| 2 | ... | ❌ FAIL | ... |

List any bugs found with reproduction steps. Do not fix bugs — report them only.

## Rules
- Always take a screenshot after navigation to confirm you landed on the right view
- Test the happy path first, then edge cases (a card with every fact unknown, a
  `withheld` cell, an empty filter result)
- All screenshots go to `.claude/ui-testing/screenshots/{feature-name}/`
- Do not modify any code
