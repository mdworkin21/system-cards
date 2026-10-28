# Autopilot Phase 5: review brief

Read by `/autopilot` Phase 5 (`.claude/commands/autopilot.md`). Do not merge.
Do not set a card's verification fields.

Three shapes. Pick by what the PR touches, in this order:

1. `sources/` or `normalization/` changed → **card brief**.
2. `site/src/` (excluding tests) changed → **UI handoff** first, brief later.
3. Otherwise → **short form** or **full form** by size.

Every shape ends with the literal line **READY FOR HUMAN REVIEW**. Never
describe the PR as approved, verified safe, audited, or ready to merge.

## Card brief

The reviewer's job on a card PR is the audit the checker cannot do: whether
each value is what its quote says, and whether each status is the right one.
Give them exactly that, nothing they can delegate to `syscards check`.

1. **Header**: PR number and URL, branch, CI status. The document: title,
   lab URL, `sha256`, page count, `fetched_from` if a mirror was used. One
   line: "`syscards check`: N cites verified against the cached PDF, 0
   errors, K warnings (all dismissed with notes)" — or the truth if not.
2. **Facts to audit**, as a checklist, one box per line, in this order:
   - the tier: `framework.tier: <value> → <rung>` then the quote and page
   - each domain: `framework.domains.<d>: <outcome> (<raw_threshold>)` then
     the quote and page
   - every `withheld` and every `not_applicable`, with its note
   - every `not_reported` that carries a note (a dismissed deferral or
     keyword hit), with the note
   - every dismissed keyword-net warning, with the note that dismissed it
   - any other `reported` value the reviewer could read differently from
     its quote (the extractor names these; typically two to five)
   Each box is self-contained: path, value, then the quote in quotation
   marks and `(p. N)`. The reviewer opens the PDF only for boxes they
   doubt: `uv run syscards text cache/pdfs/<sha256>.pdf --page N`.
3. **Not audited by design**: one line naming the mechanical facts the
   checker proved (count), so the reviewer knows what they are skipping.
4. **Loose ends**: rejected review findings and why, anything the card
   notes as not read, the stub it replaced if any.
5. The literal line: **When the audit is done, say so; a follow-up commit
   sets `verified_by` and `verification`. Autopilot does not.**

## UI handoff (site PRs)

If the PR touches `site/src/` (excluding tests), the user's next step is
`/ui-testing` plus looking at it themselves, which may cause changes, so
close-read checklists are premature. Output only the handoff and stop:

1. PR number and URL, CI status, one-line risk label.
2. One fenced code block the user can paste whole into a local session. It
   must stand alone; `/ui-testing` must be its first line:

   ````
   ```
   /ui-testing
   First: git fetch origin <branch> && git checkout <branch> && cd site && npm ci && npm run dev
   Requirements to verify (PR #<n>):
   1. <user-visible behavior, one line, no file references>
   2. ...
   Also check: <manual-check loose ends, one line each, or omit>
   ```
   ````
3. The literal line: **Next: run the block above locally. Ask for the review
   brief when UI is settled.**

Produce the brief below only when the user asks for it (after any UI fixes
have gone through Phase 3 again). That brief **omits** "Behaviors to verify,
hands-on", the walkthroughs and manual-test recipes, and the
acceptance-criteria rows. It keeps only: header, close-read checklist (with
the sampled hygiene read and the drift boxes), estimate vs actual, loose ends.

## Code PRs: measure first

```bash
gh pr diff <PR_NUMBER> --stat
```

Count files and net app-code lines (exclude `tests/`, `*.test.*`, `docs/`,
`sources/`, lockfiles, generated files). **Under the cap** (at most 15 files
and 400 app-code lines) and one capability: the **short form**. Otherwise:
the **full form**, partitioned by capability. Both link the feature doc
instead of restating it.

### Short form (about 300 words)

1. **Header**: PR number and URL, branches, one-line risk label, CI status,
   feature doc path.
2. **What changed**: at most three bullets.
3. **Behaviors to verify, hands-on**: numbered, one line each. Data layer: a
   run recipe (the `syscards` commands and what they should print). Site: a
   list copy-pasteable into `/ui-testing`.
4. **Close-read files**, as a checklist of **decision boxes only**. State the
   head SHA once. Per file: the path as the heading, one plain-words line on
   what it does now, then one checkbox per line where the reviewer's
   judgment could change the code (`Line 61: a withheld fact counts toward
   coverage as withheld, not reported.`, `Line 118: a quote found on another
   page is an error, not a warning.`). Typically about 5 per PR; list every
   real decision; more than about 10 is a planning smell, say so in the
   header. Drop any box that restates mechanics CI or the Phase 4 review
   already verified. Schema validators and status semantics, tier rows,
   check rules, `build.py:card_record`, and text normalization are always
   here. **Drift is a decision box**: each drift row except test rows
   becomes a box at the line where it lands.
5. **Sampled hygiene read**: one line naming one skim-tier file for the
   reviewer to judge on hygiene alone (duplicate helpers, placement vs
   `docs/where-things-go.md`, comments vs
   `.claude/skills/code-comments/SKILL.md`, load-bearing tests).
6. **Estimate vs actual**: files and app-code lines, estimated → actual.
7. **Loose ends**: rejected findings and why, carried SUGGESTIONs,
   unreviewed commits (if any), anything needing manual verification.

### Full form

The same header, then **one section per capability**, in the design's
order, each self-contained so a reviewer can finish it and stop:

- **Behaviors to verify, hands-on** for this capability.
- **Behavior walkthroughs**: for each behavior, the trace through the layers
  (YAML → schema → check → build → `data.json` → component) as `path:symbol`
  references; a manual recipe with concrete inputs, expected result and at
  least one failure case; and the automated tests that cover it.
- **Attention tiers**, as validated in Phase 4: close-read files in the
  decision-box form; skim files, one line each; trust files.
- **Acceptance criteria rows**: criterion → where implemented → which test
  proves it.

After the capabilities: **Sampled hygiene read**, **Estimate vs actual**,
**Loose ends**, as in the short form.
