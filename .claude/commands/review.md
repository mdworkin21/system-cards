---
description: Enter review mode - analyze code and cards for bugs, provenance holes, and best practices without writing code
model: fable
---

You are in REVIEW MODE. Do not write any code. Do not edit any card.

## Evidence contract (READ FIRST — applies to every finding and every claim)

This review is only trustworthy if its claims are auditable in seconds. You
MUST follow these rules. A reviewer that cannot honor them must say so rather
than guess.

1. **Every finding cites a location.** Each finding names the exact
   `path/to/file.py:line` (a range is fine), or for a card the fact's dotted
   path (`sources/openai/gpt-5.2.yaml` `framework.domains.cyber`). No location
   → not a finding, delete it.

2. **Every factual claim about the code or a document names how it was
   verified.** When you assert what the code *does* or what a page *says*,
   append the evidence in brackets: the file:line you read, the page you
   opened (`[read sha256.pdf p. 16 via syscards text]`), or the command you
   ran and its result (`[ran: uv run syscards check — 0 errors, 2 warnings]`).

3. **Verified vs. inferred must be labeled.** If you did not actually read the
   relevant code or page or run the check, you may NOT state it as fact. Either
   verify it now, or mark it `[NOT VERIFIED — inference]` and lower its
   severity. An honest "I didn't check X" is worth more than a confident guess.

4. **No claim about code or pages you didn't open.** If a finding depends on
   behavior in a file you have not read in this session, or on what a page
   says, read it first or do not raise the finding. Do not reason from the
   filename, the diff hunk alone, the quote alone, or what cards "usually" say.

5. **Surrounding context, not just the diff.** Read around each change. For
   a card, read the cited page around the quote, not the quote alone. A
   diff-only judgment is labeled `[diff-only]` so its limits are visible.

6. **Uncertainty is reported, not hidden.** If you are unsure, say the specific
   thing you are unsure about and what would resolve it.

If following this contract would require more reading than fits comfortably in
context, STOP and tell the user the review scope is too large to do honestly —
recommend splitting it. Do not skim and pretend.

## If a PR number is provided

1. Fetch the PR's changed files (GitHub MCP pull-request tools, owner
   `mdworkin21`, repo `system-cards`, or `gh pr diff <PR#> --name-only`)
2. **Determine the review round**: fetch existing reviews. Count how many prior
   reviews exist and set this round to N+1. Tell the user: "This is **Round N**
   of review."
3. Read each changed file locally to understand full context. For a changed
   card, make sure its PDF is cached (`uv run syscards fetch-all`; if a host is
   unreachable, say the quotes could not be verified here) and run
   `uv run syscards check`.

## If no PR number is provided

1. Ask the user what branch or files to review
2. Read the changed files and their surrounding context

## Multi-pass review methodology

Do NOT review in a single freeform pass. Make **seven sequential passes**
through the changed files, each with a specific lens. Accumulate all findings
into one consolidated list.

### Pass 1: Correctness
- Logic bugs, off-by-one on page indexes, wrong return types
- None handling, missing edge cases (a card with no sha256, a Fact with no
  cite, an empty `sources/`)
- Determinism of `build` (ordering, no timestamps)
- Exit codes and `Finding` levels: is an error really an error?
- Data flow: does the value actually get from the YAML to `data.json`?

### Pass 2: Provenance and data integrity
For every changed card (`sources/`):
- Every `reported` or `withheld` fact has a cite; `uv run syscards check`
  reports zero errors with the PDF cached. If the PDF is not cached, say so:
  the quotes are unverified and that is a WARN on the PR, not on the card.
- **Does the value say what the quote says?** Open the page. A value that
  states more than the quote supports, drops a hedge the quote carries, or
  resolves an ambiguity the lab left open is a CRITICAL. The designation rule
  (`docs/schema.md`) decides between `threshold_reached` and
  `threshold_not_ruled_out`.
- **Is the status right?** `not_reported` when the card defers to another
  document (fine, with a note) versus `not_applicable` (only when the
  question cannot apply) versus `withheld` (the card says it looked).
- Every dismissed keyword-net warning carries a note naming what the keyword
  was; a dismissal without one is a WARN.
- `framework.tier.value` is mapped in `tiers.yaml`, and the rung is
  defensible from the quote.
- `provenance.verification` is `none` and `verified_by` empty unless the PR
  says who audited; a PR that sets them is a CRITICAL.
- `document.fetched_from` is set when the bytes came from a mirror; the
  mirror's recorded hash matches.
For code changes:
- Nothing writes to `sources/`; nothing becomes a second source of truth
- No fact, lab name, or tier mapping in code or in the site
- No network outside `fetch.py`; no test touches a socket or `cache/`
- The schema export is regenerated when the models changed
  (`uv run syscards schema --check`)

### Pass 3: Architecture & patterns
- Consistency with `docs/where-things-go.md`: module responsibilities,
  the Finding/CLI split, option reuse
- DRY: a second normalization helper, a second way to walk facts
- Naming matches what is already in the codebase
- Missing or unnecessary abstractions
- **Comments in the diff** follow `.claude/skills/code-comments/SKILL.md`:
  flag comments over the length limits, history/narrative, PR or plan
  references, restated code, and stale comments. The fix is to cut.

### Pass 4: Site (skip if no `site/` changes)
- React anti-patterns (hooks after early returns, setState in effects,
  unstable deps)
- Missing error, loading, and empty states (zero cards; a card with every
  fact unknown)
- Accessibility: status encoded by shape or text as well as color
- Hardcoded labs, tiers, or status meanings; prose that restates a card
- Types from `types.generated.ts`, not hand-written duplicates

### Pass 5: Test coverage
- Are the important behaviors tested? Edge cases and error paths?
- Are tests testing behavior, not implementation details?
- **Is every added or changed test load-bearing?** (CLAUDE.md rule #8,
  `.claude/skills/writing-tests/SKILL.md`.) For each one, name the bug it
  catches and check the assertions would fail on that bug. Flag as findings:
  tests with no nameable bug, tests whose assertions pass with the bug
  present, tests that duplicate another test's check, tests that need the
  network or `cache/pdfs/`.
  The fix for a non-load-bearing test is to strengthen it or delete it.

### Pass 6: Code organization
Read `docs/where-things-go.md` before starting this pass. For every changed
or added file, check:
- Is the file where the directory-intent table says? (a rule in `check.py`,
  not `cli.py`; a derived field in `build.py`, not the site; a judgment in
  `tiers.yaml`, not anywhere else)
- Does any CLI command contain logic that belongs in a module?
- Does any module reach across a seam (schema reading files, build fetching)?

For each violation: cite the heuristic that applies and explain why the
placement violates it. For defensible but non-obvious placement: a
**[SUGGESTION]** with reasoning. **If where-things-go.md does not cover the
pattern**, flag it: "GAP in where-things-go.md: ..." and propose a rule.

### Pass 7: Documentation

Skip this pass entirely if the diff only touches tests, is a pure refactor
with no behavioral change, or is a single card with no schema or table change.

Run `find docs/ -name '*.md'` to get the current doc inventory. Then:

#### 7a — Staleness
For each changed file, check whether a related doc exists under `docs/`
(`docs/schema.md` for models and check rules, `docs/normalization.md` for
the table, `docs/adding-a-card.md` for the procedure and CLI, `docs/plan.md`
status line for a phase, `docs/building-blocks.md` for a shared piece). Read
it and verify it still describes the behavior after the diff. Flag
mismatches as **[WARN]**.

#### 7b — Coverage gaps
If the diff introduces a **new feature surface** (a CLI command family, a
check-rule family, a site view, a workflow) and no doc exists, flag the gap
as a **[SUGGESTION]** with the suggested path under `docs/` and what it
should cover. Do not flag minor helpers.

#### 7c — Quiz catalog
`docs/quiz-topics.md` is the catalog `/quiz` draws from. A new feature
surface or a new card without a row → **[SUGGESTION]** with the drafted row.
An existing row now wrong → **[WARN]**. Rows must match the file's format
contract (`| **Topic name** | … |`); a malformed row is **[WARN]**.

## Presenting findings

After all seven passes:

### Finding labels

Every finding gets a short label: `L{layer}-{severity}{number}`.
- **Layer** = sequential number based on presentation order (L1, L2, ...)
- **Severity** = C (critical), W (warn), S (suggestion)
- **Number** = sequential within that layer+severity

### Presentation

1. Break findings into logical layers (schema → check → build → CLI → cards
   → site → tests → organization → docs). Provenance findings (Pass 2) are
   cross-cutting: place each in the layer of the file it affects.
2. Assign each finding its label and classify: **[CRITICAL]** (bugs, a value
   the quote does not support, a second source of truth, verification set by
   a machine), **[WARN]** (pattern violations, missing coverage, unverified
   quotes, likely problems), **[SUGGESTION]** (improvements)
3. **Audit gate:** every listed finding must carry its location and its
   `[evidence]` tag. Strip or downgrade any finding that doesn't.
4. Present one layer at a time, pause to discuss before moving on

### Actionable fix descriptions

Every finding MUST include a concrete fix description precise enough for
`/fix-review`'s model to implement without guessing: exactly what to change,
in which file, function and line; for a card, the field, the status or value
to set, and the page and words to cite instead. If the fix requires a
judgment call, give your recommendation and cite an existing example.

## Review focus guide

At each layer checkpoint, briefly tell the user which findings need close
review vs. which can be skimmed, and why.

## Posting to GitHub (PR reviews only)

After discussion, post findings to GitHub as a PR review:
- **Prefix the review body with `## Round N`**
- **Each comment includes its label**: e.g., `[Round 2] [L1-W2] ...`
- Use `COMMENT` event (never `REQUEST_CHANGES` on own PRs)
- Include a summary in the review body after the round header
- A separate session can then use `/fix-review <PR#> round-N`
