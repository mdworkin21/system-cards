# Building blocks

What already exists to build on. `/plan-a` step 3 reads this before designing
anything new; a plan that adds a model, a check rule, a CLI command, a build
field, or a site component must say which row here it checked. Placement
rules (which directory a new thing goes in) are in `docs/where-things-go.md`
and are not repeated.

Paths are relative to the repo root, verified at `e1a73a2`. Cite rows as
`path:symbol`; the symbol is the Block column. Keep this file current: a PR
that adds or removes a shared piece updates its row.

**Who reads this.** Only `/plan-a` step 3, and only the sections the
capability touches. The implementer never reads it; the design doc's
component table carries what it needs.

**Keeping it small.** Rows are for reusable pieces only, never every
function. A PR that deletes a piece deletes its row. When a section passes
about 40 rows, split it into its own file and leave a one-line pointer here.

## Schema (`src/system_cards/schema.py`)

| Block | What it is | Use it when |
|---|---|---|
| `Strict` | pydantic base: `extra="forbid"`, stripped strings | every model in the record |
| `Status`, `CITED_STATUSES` | the five statuses; `reported` and `withheld` require a cite | any field that records what a card says |
| `Cite` | `page` (1-based physical), `quote` (verbatim, at least 8 chars), optional `note` | anything a person must be able to check |
| `Fact` | `status`, `value: str`, `cite`, `note`; `_check_cite_rules` enforces cite-when-cited and value-only-when-reported | a free-text answer to a schema question |
| `DomainAssessment`, `DomainOutcome` | a Fact whose value is the six-way outcome enum, plus `raw_threshold` for the lab's own term | a dangerous-capability domain |
| `Framework`, `FrameworkName`, `Domains` | framework name and version, the tier Fact, the five fixed domains | the framework block |
| `Evaluations`: `AlignmentEvals`, `AgenticSafetyEvals`, `HarmAndHonestyEvals`, `welfare` | fixed groups of Facts | an evaluation question |
| `ThirdParty`, `ThirdPartyAssessment`, `ThirdPartyOrg` | a summary Fact plus named assessors, each with its own cite; `other` requires `org_name`; assessments require a reported summary | external testing |
| `Mitigations`, `TrainingDisclosure`, `DisclosureMeta`, `Provenance` | the remaining groups; `Provenance` rejects a verification level without `verified_by` | |
| `ModelInfo`, `Document`, `DocumentKind`, `PartialDate` | models a document covers; the document's identity (`url`, `landing_url`, `sha256`, `pages`, `fetched`, `fetched_from`); month-or-day dates | the document block |
| `Card`, `ID_PATTERN`, `Card.lab` | the record; ids are `<lab>/<slug>/<yyyy-mm>` | |
| `KEYWORDS`, `keyword_pattern`, `keyword_hits` | per-fact-path keywords; word-based matching, all-caps terms case-sensitive | the keyword net; every new Fact field needs an entry |
| `iter_facts` | every Fact or DomainAssessment on a card with its dotted path, in schema order | anything that walks a card: `check`, `build`, the site's `fact_paths` |

## PDF text (`src/system_cards/pdftext.py`)

| Block | What it is | Use it when |
|---|---|---|
| `normalize` | NFKC, curly quotes and dashes to ASCII, soft hyphens removed, whitespace collapsed; idempotent | comparing any text to a page |
| `page_variants` | a page with line-end hyphens joined, and kept | matching across line breaks |
| `page_texts` | raw text per page via pymupdf, index 0 is page 1 | reading a cached PDF |
| `quote_on_page`, `pages_containing` | the quote check, and where else a quote appears | verifying or locating a cite |
| `full_text` | the whole document normalized | the keyword net |

## Checking (`src/system_cards/check.py`)

| Block | What it is | Use it when |
|---|---|---|
| `Finding`, `Level` | frozen dataclass: level, card, path, message; `str()` is the CLI line | any rule's output |
| `check_card` | every per-card rule: tier mapping, verification-vs-unknown, page count, quote-on-page with the found-elsewhere hint, keyword net | adding a per-card rule |
| `check_sources` | loads every source, id-matches-path, uniqueness, then `check_card` | adding a cross-card rule |
| `has_errors` | the exit-code decision | |

## Normalization (`src/system_cards/normalization.py`)

| Block | What it is | Use it when |
|---|---|---|
| `TierTable`, `TierMapping`, `load_tier_table`, `TierTable.rung_for` | the ladder and its rows, validated (known rungs, unique `(framework, raw)`) | any lookup of a rung |

## Loading (`src/system_cards/loader.py`)

| Block | What it is | Use it when |
|---|---|---|
| `load_card`, `source_paths`, `expected_id_prefix` | yaml to `Card`; `sources/*/*.yaml` sorted; the id prefix a path implies | anything that reads `sources/` |

## Build (`src/system_cards/build.py`)

| Block | What it is | Use it when |
|---|---|---|
| `card_record` | a card's JSON plus `lab`, `normalized_tier`, `withheld`, `not_reported`, `coverage` | adding a derived field the site needs |
| `build_dataset`, `write_dataset` | the deterministic dataset, sorted by lab, published, id, with `schema_version`, `normalization_version`, `rungs`, `fact_paths` | |

## Fetch (`src/system_cards/fetch.py`)

| Block | What it is | Use it when |
|---|---|---|
| `fetch`, `download`, `store`, `Fetched`, `DocumentChanged`, `sha256_of`, `DEFAULT_CACHE` | the content-addressed cache; never overwrites; refuses a URL whose bytes changed | any download |

## CLI (`src/system_cards/cli.py`)

| Block | What it is | Use it when |
|---|---|---|
| `main` and `check`, `build`, `schema`, `fetch`, `fetch-all`, `text`, `find` | click group; shared `_sources_opt`, `_cache_opt`, `_table_opt`; `DEFAULT_SCHEMA`, `DEFAULT_OUT` | a new command reuses the options and exit-code conventions |

## Test fixtures (`tests/`)

| Block | What it is | Use it when |
|---|---|---|
| `tiny_pdf` (`conftest.py`) | a two-page synthetic PDF with a curly quote and a line-end hyphen | any test that needs a PDF |
| `repo_root` (`conftest.py`) | the checkout | tests over the real `sources/` |
| `card_for`, `write_card`, `cached`, `run` (`test_check.py`) | a valid card dict bound to a PDF, written to a temp sources dir, checked | testing a check rule |
| `minimal_card` (`test_schema.py`) | the smallest valid `Card` with overrides | testing a schema rule |

## Site

None yet. Phase 2 adds `site/src/lib/` (loading `data.json`, selectors,
status and rung formatting) and the first components; this section is filled
then, with the same columns.
