# Plan: a system-card comparison dashboard

A reference page that answers, in one glance, "what did each lab's system
card actually say?" for frontier models: which safety framework and tier,
which risk domains were assessed and with what outcome, who tested it
externally, which alignment and agentic-safety evaluations were run, and
what the card *doesn't* say. Static site, no backend, every cell cites a
page in a primary document.

Status: plan only. Written 2026-10-24. Repo created and stack decided
2026-10-25. Nothing built.

## 1. What this is and is not

**Is:** a structured, page-cited, per-card comparison of what each card
says about frontier risk: framework tier, per-domain threshold outcomes,
third-party testing, alignment and agentic-safety evaluations, and what is
withheld. As of 2026-10-24 no maintained public instance of that exists.
Two projects are adjacent and are detailed in section 10. Model Card
Explorer has the document collection, versioning, a harm-category coverage
matrix and a live UI, but no framework-tier or threshold content and no
page cites. Frontier Model Observatory has the right evidence-first data
philosophy but is in a calibration phase with no UI and no public dataset.
SaferAI grades *frameworks*, FLI grades *labs*, AI Lab Watch is
unmaintained since September 2025, Epoch covers *compute and metadata*.
The gap is the safety content of the cards themselves, cited to the page.

**Is not:** a ranking or a grade. No composite score. Where a judgment is
unavoidable (mapping lab-specific tiers onto a shared ladder) the raw term
is shown next to the normalized one and the mapping is a versioned,
documented table.

**Is not:** a benchmark leaderboard. Capability numbers are already well
covered elsewhere; link out rather than re-extract. Include only the
benchmark rows the card itself uses as safety-relevant evidence.

## 2. Why the data layer is the whole problem

Three things the research turned up that shape the design:

1. **Secondary sources disagree with each other.** Blog aggregators gave
   conflicting release dates and version numbers for the same models and
   frameworks. No field is admitted without a primary cite.
2. **Cards are structurally heterogeneous.** The AI Transparency Atlas
   paper (arXiv 2512.12443) found 947 distinct section names across five
   frontier cards. A fixed schema with explicit "not reported" is the only
   way to compare them.
3. **One document can cover several models, and index pages have errors.**
   Anthropic's Fable 5.1 and Mythos 5.1 share one card; one "benchmarked
   capabilities" link on the transparency page points at a file named for
   a different model. So: documents and models are separate entities, and
   every stored document carries a sha256 and fetch date.

## 3. Design principles

These mirror the invariants in ctrleval, because they earned their keep there.

1. **Primary sources only, every fact cites.** A fact carries document id,
   page, verbatim quote, extraction date, extractor, verification status.
2. **Fact status is explicit.** `reported` / `withheld` / `not_reported` /
   `not_applicable`, distinct from `unknown` (nobody has looked yet).
   `withheld` means the card says the evaluation ran but does not publish
   the result. `withheld` and `not_reported` are findings and render
   visibly. `unknown` renders as a gap in *our* work. This vocabulary is
   kept compatible with Frontier Model Observatory's status set so the two
   could interoperate later.
3. **Data and presentation are separate.** Hand-edited YAML, one file per
   card, validated by a schema, compiled to a single `data.json` the site
   reads. The site has no backend and never fetches anything but that file.
4. **Documents are immutable, cards are versioned.** Labs publish addenda
   and revise cards. A revision is a new document record, never an edit.
5. **Normalization is explicit and lossy by design.** The shared vocabulary
   is small. The raw lab term is always stored and always shown on hover.
6. **Quotes are mechanically verifiable.** A check step extracts text from
   the cited page of the cached PDF and requires the quote to appear on it.
   This is the hallucination guard that makes LLM-assisted extraction safe.
7. **Smoke-test small.** Three cards, one per lab, end to end before any
   backfill.

## 4. Scope for v1

- **Labs:** Anthropic, OpenAI, Google DeepMind. These publish substantive
  cards with framework-tier determinations. xAI and Meta get stub records
  (card exists or not, link, framework name) so the gap is visible.
  Open-weight labs (DeepSeek, Qwen, Mistral) likewise as stubs.
- **Date floor:** 2025-01-01. Roughly Claude 4 onward, GPT-5 onward,
  Gemini 2.5 onward. Estimate 15 to 25 cards.
- **Anthropic inventory, confirmed from anthropic.com/transparency today:**
  Opus 4.7 (Apr 2026), Opus 4.8 (May), Sonnet 5 (Jun), Fable 5 & Mythos 5
  shared card (Jun), Opus 5 (Jul), Opus 5.5 (Sep), Sonnet 5.5 (Sep),
  Fable 5.1 & Mythos 5.1 shared card (Sep), Haiku 5.5 (Oct). Plus an
  "August 2026 Risk Report". Pre-April-2026 cards (Claude 4.x) are not on
  that page and need the archive.
- **OpenAI and Google inventories:** not confirmed from primary pages.
  openai.com and modelcards.withgoogle.com did not resolve from this
  sandbox. Model Card Explorer's CC-BY dataset lists 79 documents across
  six labs with URLs and content hashes; seed the `documents` inventory
  from it, then verify every URL and hash by hand before it counts as
  primary.
- **Third-party documents in scope as sources:** METR frontier risk
  reports, UK AISI and US CAISI pre-deployment write-ups, Apollo reports,
  where they reference a card. They attach to a card record as external
  evidence, not as the card's own claims.

## 5. Data model

Entities, in YAML, one file per card under `sources/<lab>/`.

```yaml
# sources/anthropic/claude-opus-4-8.yaml
id: anthropic/claude-opus-4-8/2026-05
models:                      # one document may cover several models
  - name: Claude Opus 4.8
    developer: Anthropic
    family: Claude 4
    release_date: 2026-05-xx
    open_weights: false
    modalities: [text, image]
    epoch_id: ...            # join key to Epoch AI's CSV for compute/metadata
document:
  kind: system_card          # system_card | model_card | addendum | risk_report | third_party
  title: ...
  url: https://...
  published: 2026-05-xx
  revised: null
  pages: 180
  sha256: ...
  fetched: 2026-10-24
framework:
  name: RSP                  # RSP | Preparedness Framework | FSF | xAI RMF | Meta FAIF | none
  version: "3.x"
  tier:
    raw: "ASL-3"
    normalized: elevated_safeguards    # see normalization.md
    cite: {page: 12, quote: "..."}
  domains:                   # each is a Fact (below)
    cbrn:        {status: reported, value: threshold_not_crossed, cite: {...}}
    cyber:       {status: reported, value: ..., cite: {...}}
    ai_rnd:      {status: reported, value: ..., cite: {...}}
    manipulation:{status: not_reported}
evaluations:
  alignment:                 # each a Fact; value is a short enum or free text
    sabotage: ...
    scheming_or_deception: ...
    eval_awareness: ...
    sycophancy: ...
    reward_hacking: ...
    self_preservation_or_shutdown: ...
  agentic_safety:
    prompt_injection: ...
    computer_use_safety: ...
    tool_misuse: ...
  harm_and_honesty:
    refusals_harmful_content: ...
    jailbreak_robustness: ...
    honesty_or_hallucination: ...
    bias: ...
  welfare: ...               # Anthropic-specific; not_applicable elsewhere is fine
third_party:
  - org: UK AISI             # UK AISI | US CAISI | METR | Apollo | Gray Swan | SecureBio | other
    pre_deployment: true
    scope: "cyber and autonomy"
    report_url: null         # if published separately
    cite: {...}
mitigations:
  deployment_safeguards: ... # classifiers, usage policies, ASL-3-style protections
  weight_security: ...
  monitoring_and_response: ...
training_disclosure:
  data_cutoff: ...
  compute_disclosed: ...
  method_notes: ...
disclosure_meta:
  section_titles: [...]      # the card's own top-level headings, verbatim
  explicit_omissions: [...]  # derived: every Fact with status withheld, for the gaps view
provenance:
  extracted_by: human | llm_assisted
  extracted_on: 2026-10-24
  verified_by: mdworkin21
  verification: full | partial | none
```

A **Fact** is `{status, value?, raw_text?, cite?}` with the rule: if
`status` is `reported` or `withheld` then `cite` is required and
`cite.page` is an integer. For `withheld`, the quote is the sentence that
says the result is not published. Everything else is a schema violation.

**Normalized tier ladder** (deliberately coarse, documented in
`docs/normalization.md`, versioned):
`no_threshold_reached` · `elevated_safeguards_triggered` ·
`critical_not_reached` · `critical_reached` · `not_assessed` ·
`not_reported`. The mapping table from `{framework, version, raw term}`
to a rung lives in one file and has a test that every raw term seen in
`sources/` is in the table.

## 6. Repo layout

```
system-cards/                    # name TBD
  sources/<lab>/<model>.yaml     # hand-edited, PR-reviewed; the only source of truth
  schema/                        # pydantic models; system-card.schema.json exported from them and checked in
  normalization/tiers.yaml       # raw-term -> rung mapping, versioned
  cache/pdfs/                    # sha256-named PDFs, gitignored
  scripts/
    fetch.py                     # url -> cache/<sha256>.pdf, records fetch date; never overwrites
    draft.py                     # pdf -> drafts/<id>.yaml via Claude, cite per fact; never writes to sources/
    review.py                    # drafts/<id>.yaml -> one-page HTML: value, quote, link to PDF page; you approve or fix
    check.py                     # schema + cite-page-has-quote (pdftotext) + not_reported keyword net + mapping coverage
    build.py                     # sources/ -> site/data.json + coverage matrix
  site/                          # Vite + React + TypeScript; reads public/data.json
    src/types.generated.ts       # from schema/system-card.schema.json; never hand-edited
  tests/                         # offline; no network, no API key
  docs/
    schema.md  normalization.md  adding-a-card.md  what-this-is-not.md
  .github/workflows/
    check.yml                    # ruff, mypy, pytest, check.py, schema drift, npm typecheck on PR
    pages.yml                    # build.py, npm ci, npm run build, deploy site/dist to Pages on main
```

**Stack (decided 2026-10-25).** Python data layer with uv, pydantic, ruff,
mypy and pytest, matching ctrleval so there is one set of habits. Python
also owns PDF text extraction and the page-level quote check, where
pymupdf is clearly stronger than the JavaScript options. Frontend is React
with TypeScript, built by Vite under `site/`, deployed to GitHub Pages by
Actions. Load the `dataviz` skill before writing any chart or matrix code.

The two languages share one source of truth. The pydantic models export
`schema/system-card.schema.json`, which is checked in; CI fails if the
file drifts from the models. `npm run gen-types` turns that JSON Schema
into `site/src/types.generated.ts` with json-schema-to-typescript, so a
schema change breaks the frontend build instead of rendering a wrong
column silently. `build.py` writes `site/public/data.json`; the Pages
workflow runs the Python build, then `npm ci` and `npm run build`, and
deploys `site/dist`. Still static, still nothing to go down.

**Extending the stack.** One rule makes extensions cheap: the YAML under
`sources/` is the only source of truth, and everything else is derived by
`build.py`. New derived outputs are additive. A new source of truth is
where pain lives.

- Querying the data: `build.py --sqlite` emits a SQLite file next to
  `data.json`; the page can run DuckDB-WASM or sql.js against it in the
  browser. No server.
- A backend API: technically a mapping from the pydantic models to
  SQLModel tables loaded by `build.py` as a derived cache. Operationally
  it is what killed Model Card Explorer. Not planned while the only
  consumer is this page.
- Write workflows (several reviewers, a review queue, comments): the one
  case that justifies a database. If it comes, use a hosted backend whose
  writes land as pull requests to the YAML, so git review, the quote check
  in CI and the provenance chain survive.

Never let a database become the source of truth; that forfeits PR diffs,
the mechanical quote check and the survive-a-hosting-lapse property, and
migrating back is hard.

## 7. Views

1. **Overview matrix.** Rows are cards grouped by lab and sorted by date.
   Columns: framework tier, each risk-domain status, third-party testers,
   alignment evals present, agentic-safety evals present, page count,
   date. Cells encode the tri-state with shape and color, never color
   alone. Hover shows the raw term, quote, and a link that opens the PDF
   at the cited page (`#page=N` works in browser viewers). This is the
   "easy reference" view and the only one Phase 2 needs.
2. **Compare.** Pick two to four cards; see the full record aligned
   field by field with `not_reported` explicit.
3. **Timeline.** Cards per lab over time, framework version changes as
   markers.
4. **Card detail.** Everything extracted for one card, with cites.
5. **Gaps.** Per lab, which schema fields are `not_reported`. "What the
   cards don't say" is often the point.

## 8. Phases

| Phase | Deliverable | Gate | Effort |
| --- | --- | --- | --- |
| 0 (optional) | Claude Artifact prototype of the matrix with 3 hand-filled cards | You look at it and say the columns are the right ones | hours |
| 1 | Repo, schema, normalization table, 3 cards (one per lab) hand-extracted, `check.py` and `build.py`, offline tests green | `build.py` emits `data.json`; every quote verified against its page | 1 to 2 days |
| 2 | React + TypeScript site with matrix and detail views, generated types, Pages deploy | Public URL renders the 3 cards | 1 to 2 days |
| 3 | Backfill to 2025 floor using `draft.py` plus human verification; compare, timeline, gaps views | Every card `verification: full` | 30 to 60 min per card, plus a day of UI |
| 4 | Maintenance: `adding-a-card.md` checklist; link the Midas Project Watchtower, which already logs system-card revisions, and build our own index-page diff job only if it proves insufficient (notify only, never auto-ingest) | | ongoing, small |

Phase 0 exists to settle the columns before the schema hardens. Skip it
if you already know what you want to see.

## 9. Risks and how the design absorbs them

- **Cross-framework normalization is contestable.** Coarse ladder, raw
  term always visible, mapping table versioned and tested. If a reader
  disagrees with a rung, the quote is one hover away.
- **LLM extraction hallucinates.** Drafts never land in `sources/`.
  `check.py` rejects any reported fact whose quote is not on the cited
  page. A human sets `verification: full`.
- **Cards are 100 to 250 pages and nobody will read them.** Nobody has
  to. The schema is about 40 facts per card. `draft.py` has the model
  read the card and propose a value plus a page and quote for each fact.
  `check.py` throws out any quote not literally on that page. What is
  left for a human is a review screen: 40 rows of value, quote, and a
  link that opens the PDF at the page. You read the quote, decide whether
  it supports the value, and click through only when it is not obvious.
  That is 20 to 40 minutes per card, and it is where the 30 to 60 minute
  estimate in section 8 comes from. Google's cards are 10 to 20 pages,
  OpenAI's 30 to 80, Anthropic's are the long ones.
- **The model misses things, so `not_reported` is the risky status.** A
  wrong `reported` is caught by the quote check; a wrong `not_reported` is
  not. Two nets: each schema field carries a keyword list (for example
  `third_party.metr` carries "METR"), and `check.py` warns when a field is
  `not_reported` but its keywords appear anywhere in the extracted text.
  Second, `draft.py` runs a targeted follow-up prompt per `not_reported`
  field asking only "does this document anywhere address X; if so, where".
  Both are cheap. A full card is about 150k tokens, so a draft plus
  follow-ups costs a few dollars.
- **Copyright.** PDFs cached locally and gitignored; the repo holds URL,
  hash, and short quotes.
- **Labs revise cards silently.** `fetch.py` refuses to overwrite; a
  changed hash at the same URL becomes a new document record and a visible
  "revised" marker. Midas Project Watchtower logs such revisions publicly
  (it recorded OpenAI revising two system cards in August 2026); cross-check
  against it.
- **Network from this sandbox.** anthropic.com resolves; openai.com and
  modelcards.withgoogle.com do not. Inventorying those two needs a normal
  network or pasted URLs.

## 10. Prior art, and what we take from each

Checked 2026-10-24. Star counts are from the GitHub pages as fetched.

- **Model Card Explorer** (github.com/owizdom/ai-research-model-cards,
  Free Systems Lab; MIT code, CC-BY 4.0 data; 197 commits, 0 stars).
  The closest existing thing. Six labs, 79 documents with content-hash
  versioning and Wayback snapshots, LLM-extracted benchmark scores, a
  coverage matrix over 15 harm-category taxonomy entries (bias, child
  safety, dual-use, mental health, and so on), a Next.js explorer and REST
  API. Its README does not mention framework tiers, per-domain threshold
  results, third-party tester names, page numbers, verbatim quotes, or any
  accuracy validation of extracted values. Opened on a phone on
  2026-10-24, the live site showed "Loading fragmentation analysis..." and
  "A matrix across 0 labs and 15 categories": the frontend is deployed but
  its database-backed API is not serving data. The CC-BY dataset in the
  repo is the usable part. *Take:* the document inventory as a seed, from
  the repo, not the site. *Do not rebuild:* benchmark extraction or
  harm-category coverage. *Lesson:* a hosted backend is a liability for a
  side project; this plan's static `data.json` has nothing to go down.
- **Frontier Model Observatory** (github.com/jlumbroso/frontier-model-observatory;
  MIT tooling; started 2026-09-05, 95 commits, 1 star). Provenance-first
  catalog with atomic claims tied to evidence, scope, attribution and
  bitemporal history. Distinguishes provider assertions, evaluation
  results, independent verification and observatory inference, and keeps
  "not reported", "not found", "not evaluated", "withheld" and "not
  applicable" separate. Calibration phase: 146 records over 12 subjects, no
  UI, no public dataset, safety-evaluation extraction listed as in
  progress. *Take:* the status vocabulary and the claim-with-evidence
  framing, so our YAML could be exported into their schema later.
- **AI Transparency Atlas** (arXiv 2512.12443). Scores *completeness* of
  documentation sections (8 sections, 23 subsections, safety-weighted) via
  LLM consensus for 5 frontier models and 100 Hugging Face cards. Presence,
  not content. Live site unconfirmed from here. *Take:* its section
  taxonomy for `disclosure_meta.section_titles` if useful.
- **Midas Project Watchtower.** Logs changes to labs' safety policies and
  system cards with commentary. Change tracking, not comparison. *Take:*
  link it from Phase 4 instead of building a revision watcher.
- **SaferAI Frontier Risk Management Tracker.** Grades frameworks, 65
  criteria, page-cited rationales; explicitly excludes model and system
  cards. *Take:* link per framework.
- **FLI AI Safety Index** and **AI Lab Watch.** Grade labs; the latter
  unmaintained since September 2025. *Take:* link only.
- **Epoch AI models CSV** (CC-BY, daily). Release dates, compute, metadata.
  *Take:* join on model name instead of re-extracting.
- **METR Frontier Risk Reports**, **UK AISI**, **US CAISI**, **Apollo**
  write-ups. *Take:* ingest as `third_party` documents.
- **OpenAI Safety Evaluations Hub.** OpenAI publishes some of its own evals
  as structured data. Unverified from here; a v2 could ingest it.

**Differentiation in one sentence:** the two adjacent projects have built
the shelf and the filing system; nobody has filled in, with page cites,
what each card says about framework tier, dangerous-capability thresholds,
external testing and alignment evaluations, and nobody renders the
withheld and not-reported cells as first-class results.

## 11. Decisions needed before Phase 1

1. **Lab scope and date floor.** Recommended: Anthropic, OpenAI, Google
   DeepMind at full depth from 2025-01-01; stubs for xAI, Meta, and
   open-weight labs.
2. **Emphasis.** Recommended: safety-framework-centric, as above.
   Capability benchmarks only where the card uses them as safety evidence.
3. **Stack.** Decided 2026-10-25: Python data layer, React with
   TypeScript frontend, types generated from the schema, GitHub Pages.
4. **Phase 0 artifact prototype.** Yes or skip.
5. **Repo name and visibility.** Decided 2026-10-25: `system-cards`,
   public.
6. **Who else reads it.** Changes nothing in Phase 1, but decides whether
   Phase 3 gets the compare and gaps views or just the matrix.
