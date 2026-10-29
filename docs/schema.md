# The record schema

One YAML file per system-card document under `sources/<lab>/<slug>.yaml`.
The pydantic models in `src/system_cards/schema.py` are the definition;
`schema/system-card.schema.json` is exported from them (`syscards schema`)
and checked in so the frontend can generate types from it. CI fails if
the export drifts.

The export's root is `Dataset`, the shape of `data.json`
(`src/system_cards/build.py:dataset_schema`); `Card` is under `$defs`.
`data.json` carries `schema_version`, `normalization_version`, `rungs`,
`fact_paths`, `domain_outcomes` (the outcome ladder, `DomainOutcome` in
enum order without `not_assessed`) and `cards`; each card is a
`CardRecord`: the source record plus `lab`, `normalized_tier`, `withheld`,
`not_reported` and `coverage`. Fields the build always writes are
required in the export.

## Facts

Almost every field that records something the card says is a **Fact**:

```yaml
status: reported            # reported | withheld | not_reported | not_applicable | unknown
value: "ASL-3"              # short answer; only allowed when status is reported
cite:                       # required when status is reported or withheld
  page: 12                  # 1-based physical page of the cached PDF
  quote: "..."              # verbatim; check verifies it is on that page
  note: "..."               # optional context the quote needs
note: "..."                 # optional, any status
```

The five statuses mean different things and the difference is the point:

| status | meaning | shows in the matrix as |
| --- | --- | --- |
| `reported` | the card answers the question | the value, with the quote on hover |
| `withheld` | the card says it looked but does not publish the result | a visible "withheld" cell |
| `not_reported` | the card is silent | a visible gap in the card |
| `not_applicable` | the question cannot apply (say why in `note`) | greyed out |
| `unknown` | nobody has checked yet | a gap in *our* work |

`unknown` is the default for every Fact, so a partially extracted card is
valid. It is never a statement about the card.

**Risk-domain assessments** (`framework.domains.*`) are Facts whose `value`
is one of a small enum, with the lab's own threshold name kept beside it:

```yaml
cyber:
  status: reported
  value: alert_threshold_reached   # below_threshold | alert_threshold_reached |
                                   # threshold_not_ruled_out | threshold_reached |
                                   # critical_reached | not_assessed
  raw_threshold: "Cyber Uplift Level 1"
  cite: {page: 8, quote: "..."}
```

The rule for picking `value` is: record the lab's **designation**, not your
reading of their evidence. If a lab says it is "conservatively treating"
the model as past a threshold, that is `threshold_reached`, and the
hedging goes in `note`. `threshold_not_ruled_out` is for a lab that
explicitly declines to conclude either way.

## The rest of a card

- `id`: `<lab>/<model-slug>/<yyyy-mm>`; must match the file path.
- `models`: one or more. A document can cover several models.
- `document`: kind, title, `url` (the file itself at the lab's host),
  optional `landing_url`, dates, page count, `sha256` of the bytes,
  `fetched`, and `fetched_from` when the bytes came from a mirror.
- `framework`: name, version, `tier` (a Fact whose value is the lab's own
  model-level term; the shared rung is computed at build time, see
  [normalization.md](normalization.md)), `domains`.
- `evaluations`, `third_party`, `mitigations`, `training_disclosure`:
  groups of Facts. `third_party.assessments` lists named external
  evaluators, each with its own cite.
- `disclosure_meta.section_titles`: the card's own top-level headings.
- `provenance`: who extracted, when, who verified, and how fully.
  `verification: full` is rejected while any Fact is still `unknown`.
- `notes`: anything the record needs to say about itself.

Dates are strings at the precision the source gives: `2026-02` or
`2026-02-11`. Labs often publish "February 2026" and nothing finer.

## What `syscards check` enforces

1. Schema validity, including the cite rules above.
2. `id` matches the path and is unique.
3. Every reported `framework.tier` value has a mapping in the
   normalization table.
4. If the document's PDF is in `cache/pdfs/<sha256>.pdf`: the page count
   matches, and every quote is literally on its cited page, after
   whitespace, quote-mark and ligature normalization. A quote that is on
   a different page is reported with the page it was found on.
5. The keyword net: a Fact marked `not_reported` while the document
   contains that Fact's keywords is a warning to look again.
6. `verification: full` with any `unknown` Fact is an error.

Without the PDF, steps 4 and 5 are skipped with a warning. Pass
`--require-pdfs` to make that an error.
