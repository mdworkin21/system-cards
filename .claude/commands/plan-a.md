---
description: Enter planning mode (planning v2) - analyze requirements and create implementation plans without writing code
model: fable
---

You are in PLANNING MODE. Do not write application code. A plan session
produces `docs/templates/design-doc.md` filled in, approved in two stages
(spec, then design), plus a GitHub issue. Where that design lives depends on
the kind of work (step 1). The spec is written for the developer; the design
for the implementer and reviewer. Keeping them in separate sections with
separate word budgets is what keeps plans readable. Process context:
`docs/development-workflow.md`.

## 1. Clarify

Ask before proposing. Confirm the user-visible outcome and what is out of
scope. If the request bundles several capabilities, name each one; the size
estimate (step 5) will price bundled versus split and the developer decides.
Bundling is allowed.

**Classify the work before writing anything**, and state the class with the spec:

| Class | Test | Where the design lives | Durable doc after it ships |
|---|---|---|---|
| **New feature surface** | a new CLI command family, a new check-rule family, a new site view, a new schema group, a new workflow | a standalone doc at `docs/<slug>.md` (step 7) | that doc, updated in place to as-built |
| **Increment** | extends something that already has a doc: a field, a `KEYWORDS` entry, a tier row, a site column, a rule inside an existing family | **temporary**: the GitHub issue body, or `docs/plans/wip/<slug>.md` headed `Status: temporary — deleted by the PR that ships it`; never a permanent `docs/` doc | the existing doc(s), which the PR extends (`docs/schema.md`, `docs/normalization.md`, `docs/adding-a-card.md`, a site doc) |
| **Card** | adding or finishing one record in `sources/` | no design; `/add-card` follows `docs/adding-a-card.md` | a row in `docs/quiz-topics.md` |

For an increment, name the existing doc(s) it extends (`grep -rln` the
symbols under `docs/`). If none covers the area, it is a new surface after
all. When unsure, it is an increment. A card is not planned here; say so and
point at `/add-card`.

## 2. Spec (template section 1, ≤ 400 words)

Goal, in/out of scope, acceptance criteria table, numbered user-visible
behaviors (a run recipe for the data layer; the `/ui-testing` list for the
site), open questions. No files, functions, or line numbers. Present it and
**wait for approval**.

## 3. Reuse and refactor inventory (mandatory)

Before designing anything new:

1. Read `docs/building-blocks.md`.
2. Grep by name and keyword: `rg "<keyword>" src tests site/src`.
3. Read the module where the capability would naturally live
   (`docs/where-things-go.md` says which) to catch the same job under a
   different name.

Record each relevant block in the inventory table with a decision and evidence:

| Decision | Meaning | Consequence |
|---|---|---|
| **reuse as-is** | compose it unchanged | named in the component design |
| **generalize first** | this is the second instance of something built once | default: a behavior-preserving **PR 0**; the developer may fold it into the feature PR |
| **new** | nothing comparable exists | one line saying what was checked |

An empty inventory is wrong for anything but a trivial change.

**PR 0 is only trustworthy if the current behavior is pinned first.** Before
the refactor, check which tests cover the block being generalized. If
coverage is missing, PR 0 starts by adding only the characterization tests
needed to trust the refactor, then refactors with those tests unchanged.
Tests must earn their keep (CLAUDE.md rule #8).

**Citations in durable docs are `path:symbol`**, never a bare line number
(full rule: `.claude/skills/writing-docs/SKILL.md`).

## 4. Design (template section 2, ≤ 600 words of prose; tables and diagrams excluded)

If it can be a table or a diagram, it is not prose. Diagrams are Mermaid.

- **Context diagram**: existing boxes touched and new ones (YAML, table,
  check, build, `data.json`, site view).
- **Per capability**: two or three sentences; a sequence diagram when the
  main flow crosses more than two hops; a **Data** table when the record
  shape changes (model, field, default, `KEYWORDS` entry, export); and the
  **component design table**, every unit added or changed (model, field,
  validator, check rule, CLI command, build field, normalization row, lib
  function, component, hook, type, workflow): what it builds on from the
  inventory, what it owns, what it must not know. State ownership for site
  state. Facts never enter code; the one judgment stays in `tiers.yaml`;
  say where each thing sits per `docs/where-things-go.md`.
- **Settled decisions** table. A cross-cutting decision (constrains other
  features, or would surprise a reader of another part of the repo) gets a
  record in `docs/adr/`, drafted now and linked.
- **Size estimate** (step 5).
- **Risks and close-read files**: schema validators and status semantics,
  tier rows, any check rule, `build.py:card_record`, text normalization,
  `fetch.py`'s refuse-on-change are always close-read; plus anything to
  verify by hand. Note CI and Pages workflow implications.

**Review it before the developer sees it.** Run
`.claude/commands/review-plan.md` on sections 1–2 as a subagent (`Agent`
tool, `subagent_type: general-purpose`, `run_in_background: false`, `model`
pinned to that file's `model:` frontmatter; reading it inline does not apply
the model). Brief it with the drafted sections verbatim (never a temporary
file) and the current branch. Verify each CRITICAL and WARN against the code
yourself, amend the design, and reject the rest with a reason. Re-run only if
a CRITICAL changed the component table. Then present the design with the
review's loose ends attached: rejected findings and why, carried SUGGESTIONs,
its questions for the developer, and its measurements. **Wait for approval.**

## 5. Size estimate

Per capability and total, by category, as a range:

| Category | Count |
|---|---|
| App | every file under `src/` or `site/src/` named in section 3, once |
| Tests | one per new module, plus each existing test whose assertions change |
| Docs | new surface: the design doc; increment: each existing doc it extends; both: each doc citing a symbol the plan renames or moves (`grep -rln '<basename>' docs/` per modified file, then check the cited symbols); `docs/quiz-topics.md` for a new surface |
| Data / config | `normalization/tiers.yaml` rows, `KEYWORDS` entries, the schema export, `site/src/types.generated.ts`, workflow files |

Add 20% headroom until the review brief has three estimated-versus-actual
records, then use that ratio. If the total exceeds **15 files or 400 net
lines of app code** (tests, docs, `sources/` and generated files excluded),
say so and show the split. Information for the developer, not a rule.

## 6. Implementation plan (template section 3)

**Write it for the model in `.claude/commands/implement.md`'s `model:`
frontmatter** (check, don't assume). The less capable the implementer, the
more exact the files, signatures, edge cases, and code to mirror; for a
top-tier implementer, intent plus constraints.

- PR 0 first if the inventory produced one.
- One subsection per capability, as ordered slices: files, doc updates, and
  the capability's **tests table** (template section 3): one row per test
  with the bug it catches, why the assertion fails on that bug, and the
  existing test checked for overlap (CLAUDE.md rule #8). Tests are offline
  and build their own PDFs (`.claude/skills/writing-tests/SKILL.md`). One
  commit per capability so a bundled PR reviews in parts.
- Bullets of at most two lines, or tables. No prose paragraphs.
- End with the verification commands.

**Review section 3 before recording it.** Run `review-plan.md` again, as in
step 4, on the full draft. The test list is not put in front of the
developer, so the review's Pass 6 is the only check it gets by default: fix
every CRITICAL and WARN before step 7. The final tests table is the contract
the implementer writes to; a test outside it is a drift row. Report the
review's tests tally (planned, removed, added) in one line with the record.

## 7. Record

After design approval:

1. **New feature surface**: write the doc to `docs/<slug>.md` with
   `Status: design`. It is updated in place during implementation; section 4
   is the drift ledger. No separate plan file.
   **Increment**: put sections 1–3 in the issue body (or, if too long for it,
   in `docs/plans/wip/<slug>.md` marked temporary) and list the existing
   doc(s) it extends. Sections 4–5 are not written there: drift and estimate
   vs actual go in the PR body, and the as-built notes go into the existing
   doc(s). The PR that ships the increment deletes the temporary file.
2. Commit on the feature branch (`feat/<slug>`, per `CLAUDE.md`). Local
   session: wait for the go-ahead. Remote session: commit and push.
3. Offer to create the GitHub issue (owner `mdworkin21`, repo
   `system-cards`): body = section 1 verbatim plus the doc path (new surface)
   or the design and the docs it extends (increment), and the branch. The
   doc is the source of truth if they diverge.
4. State whether PR 0, if any, is its own issue or a commit in this one.

End with: "Confirm, or what would you change?"
