# Where things go

The rules for where code, data and docs live in this repo. The goal is that
someone who did not write a piece can find it and extend it without
guessing. Boring and predictable beats clever.

A new engineer should be able to answer two questions quickly:

1. Where do I find existing functionality?
2. Where should I put new functionality?

---

# High-level principle

Put a thing where another engineer would naturally look for it, organized by
**what kind of thing it is**:

- a fact about a card → `sources/` (YAML), never code
- a cross-lab judgment → `normalization/`, never code
- a rule about what a valid record is → the pydantic models in `src/system_cards/schema.py`
- a mechanical verification → `src/system_cards/check.py`
- a derived view of the data → `src/system_cards/build.py` (shape) or `site/` (presentation)
- text handling of documents → `src/system_cards/pdftext.py`
- network and the cache → `src/system_cards/fetch.py`

When in doubt, prefer the most specific, responsibility-based location.

---

# The most important rule

Do not create new folders or patterns casually.

Before adding a helper, module, field or abstraction, search for an existing
place that already handles:

- status semantics (`Status`, `_check_cite_rules`)
- cites and quote matching (`Cite`, `pdftext.normalize`, `quote_on_page`)
- walking a card's facts (`iter_facts`)
- keyword matching (`KEYWORDS`, `keyword_pattern`)
- tier normalization (`TierTable`)
- loading and locating sources (`loader`)
- reporting findings (`check.Finding`)
- CLI option defaults (`cli._sources_opt` and friends)

If a pattern exists, extend it instead of inventing a parallel one.

---

# Directory intent

## sources/

Purpose: the dataset. One YAML file per system-card document, hand-reviewed,
the only source of truth.

Put here:

- `sources/<lab>/<model-slug>.yaml`, one per document; `id` must start with
  `<lab>/<model-slug>/`
- a stub for a known document whose PDF could not be fetched yet (all facts
  `unknown`, `verification: none`, a `notes` line saying why)

Do not put here:

- anything a program wrote without a person reading it (that is `drafts/`)
- derived values (the normalized rung, coverage counts; `build` computes them)
- long excerpts; a cite is one or two sentences

Rule of thumb: if you cannot name the page and quote it verbatim, it is not a
fact yet. Procedure: `docs/adding-a-card.md`.

---

## normalization/

Purpose: the one place a cross-lab judgment lives.

Put here:

- `tiers.yaml`: the rung ladder and the `(framework, raw term) → rung` rows

Do not put here:

- per-domain outcomes (those are chosen on the card from the enum, with the
  lab's threshold name beside them)
- anything a card could say about itself

Rule of thumb: a new lab term in a card's `framework.tier.value` means a new
row here in the same change; `syscards check` fails otherwise. Bump `version`
when a row's meaning changes. See `docs/normalization.md`.

---

## schema/

Purpose: the generated JSON Schema the frontend builds its types from.

Put here:

- `system-card.schema.json`, written by `syscards schema`, drift-checked in CI

Do not put here:

- hand edits (regenerate instead)
- a second schema format

---

## src/system_cards/

Purpose: the data layer, installed as the `syscards` CLI. One module per
responsibility:

| Module | Owns | Does not own |
|---|---|---|
| `schema.py` | the record shape: `Card` and every model under it, `Status`, `Cite`, `Fact`, `DomainAssessment`, validation rules, `KEYWORDS` and keyword matching, `iter_facts` | reading files, PDFs, output shaping |
| `pdftext.py` | page text from a cached PDF; text normalization; `quote_on_page`; `pages_containing` | deciding what a failed match means (that is `check`) |
| `check.py` | turning cards plus cached PDFs into `Finding`s: ids, tier mapping, page counts, quote-on-page, keyword net, provenance rules | printing (that is `cli`), fetching |
| `build.py` | the deterministic `data.json` and its typed models (`Dataset`, `CardRecord`, `Coverage`), the root of the schema export: card records plus `normalized_tier`, `withheld`, `not_reported`, `coverage`, `fact_paths`, `domain_outcomes` | presentation choices (colors, ordering for display) |
| `fetch.py` | download, sha256, the content-addressed cache, refusing changed bytes | parsing |
| `loader.py` | finding and loading `sources/**/*.yaml`, the id-matches-path rule | validation beyond pydantic |
| `normalization.py` | `TierTable` and loading `tiers.yaml` | choosing a rung for a card (the table does) |
| `cli.py` | click commands, option defaults, exit codes, printing | logic |

Put here:

- a new check rule → `check.py`, returning `Finding`s, with a test on a
  synthetic PDF or card
- a new derived field for the site → a field on `build.py:CardRecord` or `Dataset`, filled in `card_record` or `build_dataset`
- a new CLI command → `cli.py`, thin, calling one function from another module
- a new field on a card → `schema.py` (model + `KEYWORDS` entry), then
  `syscards schema`, `docs/schema.md`, and the site types
- a helper two modules need → its own module named for its responsibility,
  promoted on the second real use (Anti-patterns, "God utilities")

Do not put here:

- facts about any card
- a tier mapping or any lab-specific constant
- network calls outside `fetch.py`
- anything that writes to `sources/`

Rule of thumb: `check` says whether a record is trustworthy; `build` says what
the site sees; neither decides what a card means.

---

## tests/

Purpose: offline proof that the data layer and the checked-in data behave.

Put here:

- unit tests per module, using `tmp_path` and the `tiny_pdf` fixture
  (`conftest.py`) for anything that needs a PDF
- `test_repo_data.py`: the real `sources/` must load, pass `check` without
  PDFs, have every tier mapped, and match the exported schema

Do not put here:

- tests that read `cache/pdfs/` (not in CI) or open a socket (pytest-socket
  blocks it)
- a test whose only job is coverage (CLAUDE.md rule #8)

---

## site/

Purpose: the React + TypeScript page. Reads `public/data.json` and nothing
else. Design and as-built notes: `docs/site.md`.

| Path | What goes here |
|---|---|
| `site/src/types.generated.ts` | generated from `schema/system-card.schema.json`; never hand-edited |
| `site/src/lib/` | loading `data.json`, selectors, formatting of statuses and rungs; pure functions with tests |
| `site/src/components/` | views: the matrix, compare, timeline, detail, gaps; presentational, typed by the generated types |
| `site/src/routes.tsx` | the route table and the router (hash mode on Pages); the only file that changes for browser routing |
| `site/src/App.tsx` | the layout around every view, loading and error states |
| `site/src/index.css` | Tailwind entry and the theme tokens (shadcn variables, status ink, outcome ramp); components style with Tailwind classes over these tokens, never raw colors |
| `site/src/components/ui/` | shadcn/ui primitives (copy-in source over Radix); restyled here, not in the views |
| `site/src/lib/utils.ts` | `cn()`, the class-merge helper the `ui/` components expect |
| `site/src/test/` | Vitest setup and typed fixtures with synthetic labs |
| `site/public/data.json` | build output, gitignored |

Do not put here:

- data not derived from `data.json`
- a tier mapping, a status interpretation, or any text that restates a card
- fetches to anything but the local `data.json`

Rule of thumb: if the site needs a number the build does not emit, add it to
`build.py:CardRecord` (filled in `card_record`), regenerate the schema export, then read it.

---

## docs/

Purpose: durable documentation. Flat by subsystem; one feature, one doc.

| Path | What goes here |
|---|---|
| `docs/plan.md` | the design rationale and phase plan; its status line is kept current |
| `docs/schema.md`, `docs/normalization.md`, `docs/adding-a-card.md` | the data layer's reference docs; a change to the models, the table, or the procedure updates them in the same PR |
| `docs/where-things-go.md` | this file |
| `docs/building-blocks.md` | the inventory `/plan-a` reads before designing anything new |
| `docs/development-workflow.md` | how work flows: plan, autopilot, review brief, quiz |
| `docs/<slug>.md` | a **new feature surface**'s design doc, written at its final home with `Status: design` from `docs/templates/design-doc.md`; it becomes the as-built doc in place |
| `docs/plans/wip/<slug>.md` | a temporary design for an **increment** to something that already has a doc; deleted by the PR that ships it |
| `docs/plans/` (other files) | parked plans only |
| `docs/adr/` | cross-cutting decisions (`docs/adr/README.md`) |
| `docs/templates/` | templates the workflow commands fill |
| `docs/quiz-topics.md` | the catalog `/quiz` draws from; a new feature surface adds a row |

---

## cache/, drafts/

Both gitignored.

- `cache/pdfs/<sha256>.pdf`: documents, named by content hash. `fetch` writes
  here and never overwrites.
- `drafts/`: machine-written first drafts of cards. Never read by `build` or
  `check`; a draft becomes a card only by a person moving it into `sources/`.

---

## .github/workflows/

- `check.yml`: lint, types, tests, schema drift, and `syscards check`
  without PDFs on every push and PR; a manual job that fetches every
  document and verifies every quote; the hook parser tests.
- `check.yml` job `site`: when `site/`, `schema/` or a workflow changes,
  the generated-types drift check, the lab-name grep, lint, typecheck, test
  and build.
- `pages.yml`: build the data and the site, deploy to Pages on `main`.

---

## .claude/

Agent tooling for this repo.

| Directory | What goes here |
|---|---|
| `.claude/commands/` | User-invoked slash commands; may set `model:` in frontmatter |
| `.claude/skills/` | Rules auto-offered by description; no model override |
| `.claude/reference/` | Long material a command reads on demand |
| `.claude/hooks/` | Hook scripts; parser tests run in CI |
| `.claude/output-styles/` | Response styles |

---

# Decision heuristics

## Heuristic 1: Is it a fact, a judgment, a rule, or a view?

Use this first.

- a fact about one card → `sources/`
- a judgment that compares labs → `normalization/`
- a rule about what a valid record is → `schema.py`; a mechanical proof → `check.py`
- a view of the data → `build.py` for shape, `site/` for presentation

This split resolves most placement questions.

## Heuristic 2: Could a program have gotten it wrong without a person noticing?

If yes, it must leave a trace a person can audit: a cite with a page and
quote (facts), a `Finding` with a message (checks), a `note` explaining a
dismissed warning. Anything silent goes in `check.py` as a rule, not in a
comment.

## Heuristic 3: Is it derived?

If `build` can compute it from the YAML and the table, it is never stored in
the YAML. If the site can compute it from `data.json`, it is never stored in
`data.json`, unless the site would otherwise duplicate a rule that lives in
Python (then `build` emits it once).

## Heuristic 4: Is it lab-specific?

Lab-specific vocabulary belongs on the card (`raw_threshold`, `tier.value`,
`note`) or in `tiers.yaml`. Never a `if lab == "anthropic"` in code or in the
site.

## Heuristic 5: Does it touch the network?

Only `fetch.py` does, and only through `fetch`/`download`. Tests never do.
CI's offline job never does; only the manual `quotes` job fetches.

## Heuristic 6: Is it presentation?

Colors, ordering for display, labels, tooltips, layout: `site/`. The build
emits data, not styling, and never emits text that restates a card.

---

# Practical rules for common cases

## Adding a field to a card

1. `schema.py`: the model field (a `Fact` or `DomainAssessment` with a
   default) and a `KEYWORDS` entry so the net covers it.
2. `uv run syscards schema` to refresh the export; `docs/schema.md` if the
   field changes what the reader needs to know.
3. Existing cards need no edit: the default is `unknown`. If the field is
   meant to be filled for them, that is a data PR per card.
4. Site: regenerate types; add the column or detail row.

## Adding a check rule

- A function in `check.py` that returns `Finding`s; wire it into
  `check_card` or `check_sources`.
- Decide error vs warning: an error means the record cannot be trusted; a
  warning means a person should look.
- One test on a synthetic card or `tiny_pdf` that fails if the rule is
  removed.
- `docs/schema.md` "What syscards check enforces" gets a line.

## Adding a CLI command

- A thin click function in `cli.py` calling one function from the module
  that owns the logic. Reuse `_sources_opt`, `_cache_opt`, `_table_opt`.
- Exit codes: 0 clean, 1 findings or failure, 2 refused (as `fetch` does on a
  changed document).
- `docs/adding-a-card.md` or the README if a person would run it.

## Adding a card

`docs/adding-a-card.md`. Branch `data/<lab>-<model>`. New tier term → a
`tiers.yaml` row in the same PR.

## Adding a normalization term

A row in `tiers.yaml`; bump `version` only if an existing row changes
meaning. `test_normalization.py` pins the ladder; `test_repo_data.py` pins
that every card's term is mapped.

## Adding a site view

A component under `site/src/components/`, data access through `site/src/lib/`,
types from `types.generated.ts`. If it needs a value the build does not emit,
add it to `build.py:CardRecord` first.

## Adding a doc

`.claude/skills/writing-docs/SKILL.md`: one feature one doc, cite
`path:symbol`, update `docs/quiz-topics.md` for a new surface.

---

# Naming

Modules are named for the responsibility they own: `check.py`, `build.py`,
`fetch.py`, not `utils.py`, `helpers.py`, `core.py`. Card files are the model
slug (`claude-opus-4.8.yaml`), lowercase, dots kept. Branches follow
CLAUDE.md.

---

# Anti-patterns to avoid

## Facts in code

A page number, a quote, a lab's tier term, or a model name hardcoded
anywhere under `src/` or `site/`. It belongs on a card.

## Judgment in code

A dict mapping `ASL-3` to anything. It belongs in `tiers.yaml`.

## A second source of truth

Editing `data.json`, a SQLite file, or site state by hand; a backend that
holds records. `docs/plan.md` section 6 says why.

## Quotes that were "cleaned up"

Trimming a word, fixing the lab's typo, joining two sentences from
different pages. The checker will reject it; if it does not, that is a
checker bug, not permission.

## Network in tests

Any test that needs `cache/pdfs/` or a socket. Build the PDF in the test.

## Hand-edited generated files

`schema/system-card.schema.json`, `site/src/types.generated.ts`,
`site/public/data.json`.

## God utilities

A `utils.py`. Put the helper in the module whose responsibility it serves.

When a helper is genuinely needed by two or more modules and belongs to
neither, it gets its own small module named for what it does, never for
its genericness: `dates.py` for `PartialDate` handling, `hashing.py` if
sha256 ever leaves `fetch.py`, `textnorm.py` if normalization were ever
needed outside `pdftext.py`. Two rules keep this honest: promote on the
second real use, never in anticipation of one (the first copy stays with
its owner), and the module stays single-purpose, so the third unrelated
helper gets a third module rather than joining the first two.

---

# How to search for functionality

- a rule about records → `schema.py`, then `check.py`
- how a quote is matched → `pdftext.py`
- what the site is given → `build.py`
- what a card says → the YAML, then `syscards text` on the cached PDF
- why something is the way it is → `docs/plan.md`, then `docs/adr/`

---

# Final default rule

- `sources/` holds facts
- `normalization/` holds the one judgment
- `schema.py` defines validity, `check.py` proves it
- `build.py` derives, `site/` presents
- `fetch.py` is the only thing that touches the network
- `docs/` explains, one feature per doc

If placement still feels ambiguous, choose the location where the next reader
would look first.
