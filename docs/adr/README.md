# Architecture Decision Records

One short file per decision that is **cross-cutting**: it constrains more than
the feature that made it, or it would surprise someone reading another part
of the repo. Feature-local decisions stay in the feature's design doc
(`docs/templates/design-doc.md`, "Settled decisions").

- Numbered, immutable once accepted. A reversal is a new ADR that supersedes
  the old one.
- Written in the plan session that makes the decision, linked from the design
  doc's decisions table, and shipped in the same PR.
- Keep to one screen: Context, Decision, Consequences. Cite the code that
  embodies it as `path:symbol` once it exists.

The decisions made before this index existed live in `docs/plan.md`: the
fact-status model and cite rule (section 3), the stack and the single source
of truth (section 6), and the prior-art boundaries (section 10). Lift one
into an ADR the first time it is revisited, not before.

## Reading them

`docs/adr/` holds **only current decisions**. Read the index, then open only
the ADRs for the area you are working in. When an ADR is superseded, the
superseding PR moves the old file to `docs/adr/superseded/`, sets its status
line to `superseded by NNNN`, and updates the index.

Copy `0000-template.md` to `NNNN-short-slug.md`.

## Index

| ADR | Title | Status |
|---|---|---|
| 0000 | Template | — |
