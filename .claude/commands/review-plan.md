---
description: Adversarial review of a design doc - fact-check reuse claims, component completeness, provenance, estimate, and tests before the developer reads it
model: fable
allowedArgs: freeform
---

You are in PLAN REVIEW MODE. Do not write application code. Do not edit the
design doc: return findings and the caller (`/plan-a`, or the developer)
amends it. Your job is to break the design on paper, where a hole costs a
sentence, so the developer reads a plan that has already been checked. The
test list is not put in front of them, so by default this review is the only
check it gets.

## What to review

The design to review is the text you are given: `/plan-a` passes the drafted
sections verbatim in the brief, and a developer invoking this directly pastes
the design or names a committed doc under `docs/` or a GitHub issue that
holds it. Never write a draft to a temporary file in order to review it. The
design follows `docs/templates/design-doc.md`. Review whatever sections exist
and say which passes you skipped because their section was not drafted yet:
`/plan-a` runs this twice, once on sections 1–2 and again on section 3.

Read before judging:

- the doc, all drafted sections
- `docs/where-things-go.md`: the decision heuristics, the "Practical rules
  for common cases", and the anti-patterns
- `docs/schema.md` "What syscards check enforces", and `CLAUDE.md`
  "Invariants"
- `.claude/skills/writing-tests/SKILL.md`
- only the sections of `docs/building-blocks.md` the design touches
- the last three "Estimate vs actual" records
  (`grep -rn "Estimate vs actual" docs/ --include=*.md`, template excluded)

## Evidence discipline

Severity is `CRITICAL` (the design cannot ship as written), `WARN` (wrong
but recoverable), or `SUGGESTION` (an improvement the developer may decline).
CRITICAL: a missing unit the flow needs, a second source of truth, a fact or
judgment placed in code, a false reuse claim. WARN: a check rule with no
test, a non-load-bearing test, an estimate that ignores the records, a
placement violation. SUGGESTION: a cut, a clearer name.

A finding cites the doc: section and table row (`§2 component design, row
MatrixCell`), or the behavior or acceptance-criterion number. Use
`path:symbol` only for a claim about existing code the design builds on, and
only after you opened it. Every claim about the codebase carries how it was
verified: `[read src/system_cards/check.py:check_card]`,
`[ran: rg "withheld" src — 4 hits]`. A claim you did not verify is labeled
`[NOT VERIFIED — inference]` and cannot be `CRITICAL`. Say what you are
unsure about and what would resolve it.

Each finding ends with the change to make to the doc: the row to add, the
sentence to replace, the test to delete. A finding without a proposed change
is a question, and goes in the questions list instead.

## Passes

Each pass is a question. The bullets under it are the cases to start from,
not the full set: add the cases this design's own boundaries and data
suggest, and report them the same way.

### Pass 1: Completeness (section 2)

Trace every user-visible behavior and every acceptance criterion from
section 1 through the design: YAML field → model and validator → check rule
→ `card_record` → `data.json` → generated type → lib function → component.
Each hop the trace crosses needs a row in the component design table. Check
the trace against the `where-things-go.md` "Practical rules": a new field
without a `KEYWORDS` entry and a schema re-export, a new status without a
coverage and rendering path, a new check rule without an error-or-warning
decision, a new CLI command without an exit-code convention, a new site
value the build does not emit. A missing hop is `CRITICAL`; name the unit,
its kind, and what it builds on.

Then the reverse: a unit in the table that no behavior reaches is either
missing a behavior in section 1 or is unneeded. Ask which.

### Pass 2: Adversarial design (section 2)

For each unit and each boundary the flow crosses (a PDF, a YAML file, the
table, the build, the browser), try to break it and write down what happens.
Start with these and add whatever this design invites:

- a quote that spans two pages, or appears on three
- a lab revises the PDF at the same URL; a card whose document has no
  `sha256`; a document the fetch cannot reach
- a card covering two models; a document that is an addendum to another
- a tier term not in `tiers.yaml`; a domain the lab does not track
- a `Fact` with a value but status `not_reported`; `verification: full` with
  an `unknown` left
- zero cards; a card with every fact `unknown`; two cards with the same id
- the build run twice; the schema export drifting from the models
- a test that needs the network or `cache/pdfs/`

The design either answers the case or a finding names the missing answer:
the unit that owns it, the rule, the level (error or warning), the message
the person sees. "The checker catches it" without the rule is a `WARN`. A
case the design cannot answer without a different shape is `CRITICAL`, and
the finding proposes the shape.

### Pass 3: Provenance and integrity (section 2)

Design-level questions, not code checks:

- Does every new field that records what a card says require a cite when
  `reported` or `withheld`? A field that can carry a lab's claim without a
  page is `CRITICAL`.
- Does anything become a second source of truth: a file edited by hand that
  the build also writes, state the site keeps, a store the YAML does not
  feed? `CRITICAL`.
- Does anything place a fact or a judgment in code or in the site (a lab
  name, a tier map, a status interpretation)? `CRITICAL`; name the YAML
  field or `tiers.yaml` row it belongs in.
- Does anything write to `sources/` automatically? Drafts go to `drafts/`;
  a person moves them. `CRITICAL`.
- Does any test or CI offline job need the network or a cached PDF? `WARN`.
- Does anything commit documents or long excerpts, or redistribute a PDF?
  `WARN`, and name the license line it crosses (`LICENSE-DATA.md`).
- Does the site fetch anything but its own `data.json`? `WARN`.

### Pass 4: Seams and placement (section 2)

- The flow against the "must not know" column: data a unit is said not to
  know must not pass through it.
- `where-things-go.md` anti-patterns, by name: facts in code, judgment in
  code, a second source of truth, quotes cleaned up, network in tests,
  hand-edited generated files, god utilities.
- Site: each piece of state has exactly one owner named in the table;
  error, loading and empty states are designed, not deferred; nothing
  restates a card in prose.

### Pass 5: Fact-check (sections 2 and 3)

- Every `path:symbol` the design builds on exists and exposes the interface
  the design assumes. Open it; do not trust the inventory row. A function
  the design calls with an argument it lacks is `CRITICAL`.
- Every inventory row marked **new**: re-run the grep and read the module
  where the capability would live. An existing block the plan missed is the
  highest-value finding this command produces; cite it `path:symbol`.
- Every row marked **generalize first**: confirm there is a second instance
  and that a PR 0 is in the plan, with the characterization tests it starts
  from.
- Estimate: re-derive the file count from the component table (section 2)
  or the file list (section 3), one per unit, plus the docs count from
  `grep -rln '<basename>' docs/` per modified file. Compare the plan's range
  to the last three estimate-vs-actual records. An estimate that ignores the
  records is `WARN`.
- Open questions in section 1 that section 2 silently answered: list them
  with the answer the design assumed.

### Pass 6: Tests (section 3) — the developer is not shown this list; you check it

Every test the plan ships is one you let through, and each one runs on every
CI run. Apply CLAUDE.md rule #8 to each planned test, and to the plan as a
whole:

1. **Name the bug.** The row must state a concrete change someone could
   plausibly make that the test catches. If you cannot name one from the row
   and the design, the test is `WARN`: delete it from the plan.
2. **Would it fail?** Given the assertion the row describes, would the bug
   make it fail? `"x" not in result`, "a call happened", an exit code
   without the message: these pass with the bug present. `WARN`: strengthen
   or delete.
3. **Is it the only one?** `rg "<symbol or message>" tests`; an existing
   test that already fails for that bug makes the new one duplicate weight.
   `WARN`: delete, and cite the existing test.

Tests that fail the bar on sight: asserting that pydantic validates a type,
round-tripping `yaml.safe_load`, snapshotting `data.json`, cosmetic message
formatting, guards for states a valid card cannot reach. A test that pins a
documented rule is fine if the row names the rule and the doc it lives in.
A test that needs the network or `cache/pdfs/` is `WARN`: rewrite it on
`tiny_pdf`.

Then the gaps, which are also findings:

- An acceptance criterion with no test that would fail if it were not met.
- A new or changed check rule with no test on a synthetic card that fails
  when the rule is removed.
- A schema change with no `test_repo_data` consequence considered (does
  every existing card still load?).
- A PR 0 without characterization tests for the block it generalizes.

Report a tally the developer can read in one line: tests planned, removed as
non-load-bearing, removed as duplicates, added for gaps.

### Pass 7: Length (sections 1–3)

The template budgets are section 1 ≤ 400 words and section 2 ≤ 600 words of
prose, tables and diagrams excluded. Measure them (strip tables, fenced
blocks, and headings before `wc -w`) and report the numbers. Then cut:

- a prose sentence that restates a row of the table beside it
- an inventory row nothing in the component table builds on
- a section 3 bullet that repeats section 2 instead of naming a file
- a diagram that shows nothing the table next to it does not

Each cut is a `SUGGESTION` quoting the text to remove. Do not propose adding
words in this pass.

### Pass 8: Implementer fit (section 3)

Section 3 is written for the model named in `.claude/commands/implement.md`'s
`model:` frontmatter (read it). For that model, check that each slice names
its files, the signatures it adds, the edge cases from Pass 2 it must handle,
and the existing code to mirror. A slice the implementer would have to design
is a `WARN`. One commit per capability, in order; PR 0 first if there is one.

## Output

No preamble, no restatement of the design. In this order:

1. **Findings**, grouped by pass, most severe first within each pass. Each:
   severity, doc location, the claim with its evidence tag, the change to
   make. Skip passes with no findings; say which passes did not run and why.
2. **Measurements**: section word counts against budget; estimate as re-derived
   versus as written, with the record you compared against; the tests tally.
3. **Questions for the developer**: findings with no proposed change, and the
   open questions section 2 answered without saying so.

## Rules

- Read-only: no code, no edits to the doc, no files, no commits.
- A design-level objection proposes the alternative shape; "this feels wrong"
  is not a finding.
- Stay in the design's scope: do not propose capabilities section 1 does not
  ask for, except as a question.
