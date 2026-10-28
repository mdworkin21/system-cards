---
name: writing-docs
description: Rules for writing or editing durable docs under docs/ — reference docs for the data layer, design docs, as-built notes, the plan's status, ADRs. Use before creating a doc, deciding where one goes, or adding as-built content after a change ships.
---

# Writing docs

Docs are read by humans and LLMs that need one fact fast. Every line costs
context; write the shortest doc that answers the reader's next question.

## Where it goes

- One feature, one doc. Before creating anything, `grep -rln` the feature's
  symbols under `docs/`. If a doc covers the area, extend it.
- **New feature surface** (a CLI command family, a check-rule family, a site
  view, a schema group): one doc at `docs/<slug>.md` from day one, from
  `docs/templates/design-doc.md`. It never moves; status goes
  design → in progress → as-built in place.
- **Increment** to an existing feature: never a new permanent doc. Merge the
  as-built notes into the existing doc (`docs/schema.md` for models and check
  rules, `docs/normalization.md` for the table, `docs/adding-a-card.md` for
  the procedure and CLI). A temporary `docs/plans/wip/<slug>.md` is deleted
  by the PR that ships it.
- **A card** gets no doc; it gets a row in `docs/quiz-topics.md`.
- Placement table: `docs/where-things-go.md` → "docs/".
- A PR that finishes a phase updates the status line of `docs/plan.md`.
  Cross-cutting decisions get an ADR (`docs/adr/README.md`).
- A PR that adds or removes a shared piece updates its row in
  `docs/building-blocks.md`.

## Citations

- Cite code as `path:symbol` (`src/system_cards/check.py:check_card`), never
  a bare line number. Add `:line` only for a claim inside a long body.
- Cite a document as its card id and page (`openai/gpt-5.2/2025-12 p. 16`).
- One claim per bullet, citation trailing it.
- Ephemeral artifacts (review findings, PR review guides, audit tables) may
  use lines.

## As-built content

What belongs: where things are, what `check` now enforces, what `data.json`
now carries, failure modes, known gaps. What doesn't: how the work went,
what was tried, PR history, restated code. That's git's and the PR's job.

## Style

- Table over prose when comparing more than two cases.
- Diagrams are Mermaid, and only when they show a mechanism the adjacent table can't.
- No preamble, no "this document describes", no summary that repeats the body.
- Deduplicate: link to the doc that owns a fact instead of restating it.
- Remove what the change made stale in the same PR.
- Never restate what a card says in a doc; the card and the site are where
  that lives.

## After a feature doc changes

Update `docs/quiz-topics.md`: a new row for a new feature surface or a new
card; for an increment, amend the row that covers the area or add nothing.
Follow that file's format contract.
