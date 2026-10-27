---
description: Enter implementation mode - follow agreed plans exactly and write code with tests
model: opus
allowedArgs: freeform
---

You are in IMPLEMENTATION MODE.

## Getting started

If arguments were provided, determine what they are:
- **GitHub issue** (e.g. `#12` or a URL): Fetch the issue (GitHub MCP, owner
  `mdworkin21`, repo `system-cards`) and use its description as the
  requirements. If the body links a design doc under `docs/`, check out its
  branch and read the doc: section 3 is the plan to follow, section 4 is where
  deviations are logged. An **increment** has no permanent design doc: its
  plan is in the issue body or a temporary `docs/plans/wip/<slug>.md`,
  deviations are reported for the PR body, and its as-built notes merge into
  the existing doc(s) the issue names; delete the temporary file in the last
  slice.
- **Text block**: Treat the text as the requirements/plan to implement.
- **A card**: stop; that is `/add-card`.

If no arguments were provided, ask the user what to implement or look for an
agreed plan in the current conversation.

Before writing any code, summarize your understanding of the requirements and
your implementation plan. Wait for confirmation.

## Implementation rules

- Follow the agreed plan exactly, do not deviate
- VERY IMPORTANT: GO SLOWLY. We go step by step, and pause so we can discuss
  and update plans before full implementation
- Follow the phased review workflow: at the start of each session, state the
  layers and checkpoint plan. Implement one layer (2-5 files), then pause to
  explain what was written and why. Wait for user review and go-ahead before
  proceeding to the next layer
- Work on a named branch off `origin/main` (`CLAUDE.md` branch naming); never
  on `main`
- Python: pydantic models inherit `Strict`; type hints everywhere, `mypy`
  strict passes; `ruff check` and `ruff format` clean; click for the CLI;
  one responsibility per module per `docs/where-things-go.md`
- Data layer invariants (`CLAUDE.md`): nothing writes to `sources/`; no tier
  mapping in code; `build` stays deterministic; network only in `fetch.py`
- Site (Phase 2): function components, TypeScript strict, types from
  `site/src/types.generated.ts` (regenerate, never edit), data only from
  `data.json`
- Comments and docstrings follow `.claude/skills/code-comments/SKILL.md`;
  tests follow `.claude/skills/writing-tests/SKILL.md`. Read both before the
  first file of each session
- Write tests alongside implementation. Every test must be load-bearing
  (CLAUDE.md rule #8): name the bug it catches, confirm it fails if that bug
  is introduced, and don't duplicate another test's check. Tests are offline
  and build their own PDFs with `tiny_pdf`. When the plan has a tests table
  (design doc section 3), write those tests; one outside it needs the same
  three answers and a drift row
- A schema change: regenerate the export (`uv run syscards schema`), add the
  `KEYWORDS` entry, update `docs/schema.md`, and run `uv run pytest` so
  `test_repo_data` proves every existing card still loads
- Never edit a card's quote, status, or value to make a check pass; if a
  rule change breaks a card, that is a finding for the user, not a data edit
- Flag immediately if you encounter anything that contradicts the plan
- If the plan doesn't specify something a user would see, ask; don't pick and
  log it as drift. Under no-pause overrides, leave it unbuilt and report the
  question

## Self-review before each checkpoint

Before presenting code at a checkpoint, do a quick self-review of what you just
wrote. Check for:
- **Correctness**: logic bugs, off-by-one on page numbers, wrong return types,
  a `Finding` at the wrong level, a non-deterministic ordering in `build`
- **Patterns**: does it match `docs/where-things-go.md`? Before adding new
  functionality, check for duplicates two ways: grep by name/keyword, AND read
  the module where similar functionality would live
- **Provenance**: can anything here put a value on a card without a cite,
  write to `sources/`, or hold a judgment that belongs in `tiers.yaml`?
- **Site** (if applicable): error, loading and empty states; nothing restates
  a card in prose; no hardcoded lab or tier
- **Tests**: are the right behaviors tested? For each test you wrote, can you
  name the bug it catches, and would it actually fail on that bug? Delete any
  test that fails that check, or that repeats another test's check
- **Comments**: every comment you added or kept passes the self-check in
  `.claude/skills/code-comments/SKILL.md`

Fix anything you find BEFORE presenting the checkpoint. The goal is that
`/review` catches only the things a fresh pair of eyes would see.
