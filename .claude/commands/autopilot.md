---
description: Full-cycle autopilot - implement (or extract a card), PR, watch CI, fix failures, self-review, iterate until review-ready
model: fable
allowedArgs: freeform
---

You are in AUTOPILOT MODE. You will orchestrate the full development lifecycle —
implement, open a PR, watch CI, self-review, fix verified findings — ending at
**READY FOR HUMAN REVIEW**. A green CI run and a clean AI review mean the PR is
ready for human review. They never authorize merging, and they never authorize
setting a card's `provenance.verification` to anything but `none`.

This command delegates to existing subcommands for each phase. Each delegated
phase runs as a **subagent** (`Agent` tool, `subagent_type: general-purpose`,
`run_in_background: false`) with `model` pinned explicitly to that command
file's own `model:` frontmatter. Reading a command file's instructions inline
does **not** apply its `model:` frontmatter — only spawning it this way does.
Do not pass `isolation: 'worktree'` on these calls: the subagent must share
this session's working directory and branch so later phases see its commits.

Brief each subagent with: an instruction to read and follow the referenced
command file, the requirements/plan and current branch/PR state, and the
stated autopilot overrides for that phase. Have it report back what it
actually did (files changed, commits made, PR state, ledger entries) so this
orchestrating session continues from git/GitHub state, not from memory.

The philosophy behind this flow (review as knowledge transfer, the review brief,
attention tiers, the card brief) is documented in `docs/development-workflow.md`.
Read it if any phase's intent is unclear.

## Getting started

If arguments were provided, determine what they are:
- **GitHub issue** (e.g. `#12` or a URL): Fetch the issue. Its body is the spec
  plus a link to a **design doc** under `docs/` on the feature branch: check out
  that branch, read the design doc, and use it as the plan and the drift
  baseline (section 3 is the implementation plan, section 4 the drift ledger,
  section 2 the design the reviewer verifies against). An **increment** (see
  `/plan-a` step 1) has no permanent design doc: its design is the issue body,
  or a temporary `docs/plans/wip/<slug>.md`, and the issue names the existing
  doc(s) it extends. If the issue has no design at all, use the issue body.
- **`card <url | lab/model | sources/<lab>/<slug>.yaml>`**: a data PR. Phase 1
  delegates to `add-card.md` instead of `implement.md`; Phase 1.5 is skipped;
  Phase 5 produces the card brief.
- **Text block or plan reference**: Treat as the requirements/plan to implement
- **`continue`**: Reconstruct current branch/PR/CI state (Phase 0), then resume
  at the appropriate phase
- **`continue <PR#>`**: Resume the specified PR
- **`review <PR#>`**: Skip directly to Phase 4 (self-review)
- **`fix-review <PR#>`**: Skip directly to Phase 6 (handle PR review)

If no arguments were provided, ask what to implement. If a material requirement
is ambiguous, stop and ask rather than guessing.

## Phase 0: Inspect state

```bash
git status
git branch --show-current
git log --oneline -10
gh pr status
```

(No `gh` in this session? Use the GitHub MCP pull-request and actions tools
for the same facts: owner `mdworkin21`, repo `system-cards`.)

- Determine whether work is already in progress and whether a PR exists.
- **Never discard or overwrite unrelated uncommitted changes.** If present,
  stop and ask.
- **Branch**: work happens on a named branch off `origin/main` (`feat/`,
  `fix/`, `data/<lab>-<model>`, per `CLAUDE.md`), never on `main` and never on
  the harness's `claude/*` branch.
- **Review-debt check**: list open PRs (`gh pr list --author @me`). If prior
  autopilot PRs are still awaiting human review, warn the user before starting
  new work: unreviewed PRs compound, and finishing reviews beats starting
  features. Proceed only if the user confirms.

## Phase 1: Implement

**Delegate to**: `.claude/commands/implement.md` (code) or
`.claude/commands/add-card.md` (a card), run as a subagent (`Agent` tool).
Read that file's `model:` frontmatter and pass that value as the subagent's
`model`.

Brief the subagent with the requirements/plan and these autopilot overrides
layered on top of the command's own instructions:
- Do NOT pause at checkpoints for user review. Implement the full scope.
- **Drift ledger**: when the implementation deviates from the design in a way
  that changes behavior, a data contract (`data.json`, the schema export, a
  check verdict), or a decision the reviewer approved in the design, record a
  row as it happens: *planned X, built Y, because Z*, with the file and line
  where it lands. Mechanical deviations (renamed signatures, split or merged
  helpers, reordered calls, a different internal structure with the same
  contract) are not drift: do not log them. New surface: append the row to
  the design doc's "Drift from design" table and commit it with the code that
  caused it. Increment: keep the rows in your report; Phase 2 puts them in the
  PR body. A test not in the design's tests table is also logged (the bug it
  catches, why it fails on that bug, the overlap you checked), or not written.
- **Commits per capability**: one commit per capability slice, in the order the
  design doc's implementation plan gives them, so `git log` reads as the
  feature's narrative. A card is one commit (`data: add <card>`), plus one for
  a normalization row if it needed one.
- **As-built docs.** The as-built content is: where things are, failure modes,
  known gaps, and for the data layer any change to what `syscards check`
  enforces or what `data.json` carries.
  - **New feature surface**: the design doc, updated in place. Set its status
    to `as-built`, fill section 5, and correct section 2 where the build
    differs. Never create a second doc for the same feature.
  - **Increment**: merge that content into the existing doc(s)
    (`docs/schema.md`, `docs/normalization.md`, `docs/adding-a-card.md`, or
    the site doc), deduplicated. Delete the temporary `docs/plans/wip/<slug>.md`
    in the last slice if there is one.
  - **Card**: no doc. A row in `docs/quiz-topics.md` "Cards".
  Follow `.claude/skills/writing-docs/SKILL.md`.
- **Estimate vs actual**: when the last slice is committed, measure the PR's
  actual files and app-code lines (tests, docs, generated files and
  `sources/` excluded) against the estimate. New surface: fill the line in the
  design doc's section 4. Increment: report it; Phase 2 puts it in the PR body.
- Stay in scope: no unrelated cleanup, no silent scope expansion, no edits to
  cards the task did not name.

Have it report back the drift rows verbatim, plus files changed and commits
made. For a card, have it report the audit table from `add-card.md` step 7
verbatim: Phase 5 is built from it.

## Phase 1.5: Simplify (code PRs only)

`/simplify` is a built-in skill (not in `.claude/commands/`) that reviews the
changed code for reuse, simplification, efficiency and altitude cleanups and
applies them. Run it as a subagent on the branch's changes once Phase 1's last
slice is committed, so its cleanups land before the PR opens and are covered by
CI and the Phase 4 review like any other code. The developer does not audit
them.

Brief the subagent with these guards:
- Observable behavior must not change. Restructuring internals is the point.
  Out of scope: the shape of `data.json`, the JSON Schema export, which
  `Finding`s `check` emits and at which level, CLI flags and exit codes, any
  symbol imported by a file outside the PR's diff, a test's assertions, and
  anything under `sources/` or `normalization/`.
- Coding principles still hold: `docs/where-things-go.md` placement, CLAUDE.md
  rule #8 (never delete or weaken a load-bearing test), no scope expansion
  beyond the branch's changed files.
- Run the repo's fast checks (`uv run ruff check . && uv run ruff format
  --check . && uv run mypy && uv run pytest -q && uv run syscards schema
  --check`). If any fails, discard the change that broke it (`git checkout --
  <file>`) rather than fixing forward.
- Commit what survives as one separate commit (`refactor: simplify <area>`),
  so it can be reverted alone. Nothing to apply → no commit.

Have it report the commit SHA (or "no changes"). → Phase 2.

## Phase 2: Open PR

**Delegate to**: `.claude/commands/open-pr.md`, run as a subagent (`Agent`
tool). Read open-pr.md's `model:` frontmatter and pass that value as the
subagent's `model`.

Brief the subagent with these autopilot overrides layered on top of
open-pr.md's own instructions:
- Step 0 (base branch): detect the base as instructed, but do NOT wait for user
  confirmation — proceed with the detected base. Only stop and ask if detection
  is genuinely ambiguous.
- Skip Step 3's user review of the PR description — push and create directly.
- Append a **Review Guide** section to the PR body that links the feature doc
  (the design doc for a new surface; the existing doc(s) plus the issue for an
  increment; `docs/adding-a-card.md` for a card) and, **partitioned by
  capability** when there is more than one, lists each capability's risk areas
  and its files needing close review vs. safe to skim (attention tiers, first
  draft — Phase 4's reviewer will validate them). For a card, the Review Guide
  is the audit table from Phase 1.
- For an increment, the Review Guide also carries the full drift rows and the
  estimate-vs-actual line from Phase 1's report; they live nowhere else.
- No attribution footer, "Generated with", or any Claude/AI mention in the PR
  title or body (open-pr.md already forbids it; restated because subagents
  have appended one anyway). Check the body before creating the PR.
- The Testing section states plainly what was **not** run (e.g. "quotes
  verified locally against the cached PDF; CI's offline job cannot verify
  them", or "site not run: no site yet"). Never write "all checks pass" for a
  check that did not run in this session.

Have it report back the PR number and URL for the CI watch phase.

## Phase 3: CI Watch

Poll CI status until all checks complete:

```bash
for i in $(seq 1 15); do
  sleep 60
  STATUS=$(gh pr checks <PR_NUMBER> 2>&1)
  echo "$STATUS"
  if echo "$STATUS" | grep -q "fail"; then
    echo "CI FAILED"
    break
  fi
  if echo "$STATUS" | grep -qv "pending\|running\|queued" && echo "$STATUS" | grep -q "pass"; then
    echo "CI PASSED"
    break
  fi
done
```

Without `gh`, poll the run with the GitHub MCP actions tools instead; same
rules.

**Never treat pending or timed-out checks as passing.** If checks are still
pending after the polling limit, stop and report which checks are pending and
that the user can resume with `continue <PR#>`.

### If CI passes → go to Phase 4

### If CI fails → fix and retry

1. Get the failed run: `gh pr checks <PR_NUMBER>` (or the actions tools)
2. Read the failure logs: `gh run view <RUN_ID> --log-failed`
3. Diagnose the root cause and make the smallest correct fix. A failing
   `syscards check` on a card is never fixed by editing the quote to match a
   guess: read the page (`syscards text`), find the words (`syscards find`),
   and cite what is there.
4. Commit, push, and return to the top of Phase 3
5. **Max 3 fix attempts per PR** (count persists across `continue` re-entries).
   If still failing, stop and report: the failure, likely cause, what was
   tried, and a recommended next step.

## Phase 4: Self-Review (via subagent)

**Delegate to**: `.claude/commands/review.md` — run in a **subagent** (`Agent`
tool) for fresh-eyes review without implementation bias. Read review.md's
`model:` frontmatter and pass that value as the subagent's `model`.

Give the subagent: the PR number, branch and base, the requirements/plan, and
these instructions:
- Read `.claude/commands/review.md` and follow its multi-pass methodology
- Run `gh pr diff <PR_NUMBER>` (or the MCP equivalent) for the diff, then read
  full files for context
- Do NOT post findings to GitHub — return them to the parent agent
- Use review.md's severity terms: CRITICAL / WARN / SUGGESTION
- **Additionally, validate the attention tiers** from the PR's Review Guide:
  independently judge which changed files contain non-obvious logic or risk.
  Schema validators and status semantics, `normalization/tiers.yaml` rows,
  any check rule, `build.py:card_record`, text normalization, and every
  judgment fact on a card are always close-read. Return corrections to the
  tiering.

review.md passes 3, 5 and 6 are the hygiene sweep (patterns, load-bearing
tests, placement). The brief's sampled hygiene read (Phase 5) is the human
check on whether that sweep can be trusted.

If the Agent tool is not available, stop and tell the user. Do not attempt a
same-session review.

### Resolving findings

For each CRITICAL or WARN finding:
1. **Independently verify it first** — read the cited code, or open the cited
   page, yourself. Do not blindly implement every finding; reject ones that are
   incorrect or out-of-scope, and record why.
2. Fix verified findings, run the relevant checks, commit, push, and re-enter
   Phase 3 (CI watch).
3. **Max 3 review-fix rounds per PR.** If findings persist after 3 rounds, stop
   and report.

SUGGESTION findings: do not expand scope for them; carry them into the review
brief for the user to judge.

If clean (or only rejected/SUGGESTION findings remain) → Phase 5.

### Re-review after later commits

The review covers the commits it saw, not the PR. Record the head SHA each
review ran against. Any commit pushed after it — review fixes, CI fixes, a
base merge that resolved conflicts — triggers a re-review of the delta
(`git diff <reviewed-sha>..HEAD`, same subagent setup and passes) before the
brief. If a delta is not re-reviewed, the brief's header must list the
unreviewed commits by SHA. A base merge with no conflict resolution needs no
re-review.

## Phase 5: Review Brief

Do not merge. Do not set `verified_by` or `verification`.

Read `.claude/reference/autopilot-review-brief.md` now and follow it: the card
brief for a data PR, the UI handoff for a site PR, otherwise the short- or
full-form brief.

## Phase 5.5: Knowledge-transfer quiz (before merge)

After the human has reviewed (and any Phase 6 fix rounds are green), prompt the
user to run `/quiz <PR#>` before they merge. Reading a diff produces an illusion
of comprehension; the quiz checks the transfer actually happened via free-recall
scenario questions (never multiple choice). For a card PR the quiz is on what
the card says. This is a prompt, not a gate: the user may decline, but the
offer must be made.

## Phase 6: Handle PR Review (on request)

**Delegate to**: `.claude/commands/fix-review.md`, run as a subagent (`Agent`
tool). Read fix-review.md's `model:` frontmatter and pass that value as the
subagent's `model`.

Brief the subagent with these autopilot overrides layered on top of
fix-review.md's own instructions:
- Do not pause after each group of fixes (overrides its step 13) — fix all
  comments, then run checks once at the end.
- Verify each comment's claim against the code, or the page, before fixing,
  same as Phase 4 findings. Skip-and-explain rather than blindly apply.
- A reviewer comment that says "audited, this is right" on a card is not a
  code change: report it; the human sets the verification fields.

After it reports back, re-enter Phase 3 (CI watch), then produce an updated
brief (Phase 5) covering what changed.

## Deploy

There is no deploy step. Merging to `main` publishes the site through GitHub
Pages (Phase 2 onward). Autopilot never merges.

## Rules

- **Never push directly to `main`. Never merge.**
- **Never force push** unless explicitly asked
- **Never set a card's `verified_by` or `verification`** (CLAUDE.md rule #9)
- **Never edit a quote to make a check pass**; find the words on the page
- **Max 3 CI-fix rounds and 3 review-fix rounds** per PR
- **No Co-Authored-By** in commit messages
- Never claim a check or test passed unless it actually ran and passed
- If stuck or a material requirement is ambiguous, stop and ask rather than
  guessing
