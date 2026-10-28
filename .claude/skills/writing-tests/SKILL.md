---
name: writing-tests
description: Rules for writing, editing, keeping, or deleting tests in this repo — pytest under tests/ (offline, synthetic PDFs) and, from Phase 2, Vitest under site/. Use before adding or changing any test, when deciding whether a change needs a test, and when reviewing tests in a diff.
---

# Writing tests

Applies to the Python data layer and the site equally.

## Every test must be load-bearing

Before writing or keeping a test, answer all three:

1. **What bug does it catch?** A concrete, plausible code change that breaks
   behavior a person adding a card, a reviewer, or the site depends on.
2. **Does it fail on that bug?** Make the change (mentally or for real) and
   check. `"x" not in result` when `result` can be empty, or "a Finding
   exists" when the bug is *which level* it has, does not fail.
3. **Is it the only test that catches it?** Search the existing tests
   (`rg "<symbol or message>" tests`). If one already fails for that bug,
   don't add another.

Can't answer all three → don't write it, and delete an existing test for the
same reason. Coverage is never the reason to add a test. A test pinning a
documented rule (`docs/schema.md`, `docs/normalization.md`) is fine if the
rule is written down and the assertion names it.

## Usually fails the bar

Data layer:
- asserting pydantic validates a type it validates everywhere
- round-tripping `yaml.safe_load` or `json.dumps`
- snapshotting `data.json` wholesale
- cosmetic edge cases nobody depends on (exact message wording, unless the
  CLI line is the contract)
- guards for states a valid card cannot reach

Site:
- static markup renders (a heading's text, a button exists) with no state behind it
- re-testing a library's own behavior
- snapshots nobody reads when they change

## Repo rules that bite

- **Offline, always.** `pytest` runs with `--disable-socket`; a test that
  opens a socket fails. Nothing downloads.
- **No cached PDFs.** `cache/pdfs/` is gitignored and absent in CI. A test
  that needs a PDF builds one with pymupdf; use the `tiny_pdf` fixture
  (`tests/conftest.py`) or extend it.
- **The real data is under test too.** `tests/test_repo_data.py` loads every
  card in `sources/`, runs `check` without PDFs, and pins the schema export.
  A schema change that breaks a card shows up there; fix the schema or the
  card deliberately, never the test.
- **Check rules are tested on synthetic cards.** `tests/test_check.py` has
  `card_for`, `write_card`, `cached`, `run`; a new rule gets one test that
  fails when the rule is removed.
- **Site fixtures come from `data.json`'s shape** (the generated types), not
  hand-written objects that drift.
- **Never write "tests pass"** for a suite that did not run in this session.

## Before finishing

For each test added or changed, state the bug it catches in one line (the
test name should already say it). Can't → strengthen it or delete it.
