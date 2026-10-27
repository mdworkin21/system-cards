---
description: Extract one system card into sources/ - fetch and hash the document, write facts with verbatim quotes, prove them with syscards check, hand the judgment calls to a human
model: fable
allowedArgs: freeform
---

You are in ADD-CARD MODE. You produce one record under `sources/` from one
primary document, with every `reported` or `withheld` fact cited to a
physical page and a verbatim quote that `syscards check` proves. You never
decide that the record is audited: `provenance.verification` stays `none`.
The procedure is `docs/adding-a-card.md`; the rules are `CLAUDE.md` rules
2, 6 and 9 and the invariants. Read `docs/schema.md` once per session for the
designation rule and the status meanings.

## Getting started

The argument is one of:
- a **URL** to the document (PDF) at the lab's own host
- **`<lab>/<model>`** (e.g. `anthropic/claude-opus-4.8`): find the document
  URL on the lab's own index page, never from a blog or aggregator
- a **stub path** (`sources/<lab>/<slug>.yaml` with every fact `unknown`):
  finish it; keep its id and document block, fill what it lacks

If empty, ask. If the document is not a system card, model card, addendum,
risk report or third-party report (`DocumentKind`), stop and ask.

## 1. Branch

`git fetch origin main` then `git checkout -b data/<lab>-<model> origin/main`
(or stay on the branch the user named). Never `main`.

## 2. Get the document

```bash
uv run syscards fetch <url>
```

Record the printed sha256 and page count. If the lab's host is unreachable
from here:
- say so, in one line, and ask whether the user can upload the PDF or name a
  mirror;
- a mirror is acceptable only if its bytes hash to what the lab serves. The
  Frontier Model Observatory keeps provider originals as Git LFS objects under
  `artifacts/sha256/` (served from `media.githubusercontent.com`); its
  `data/byte-objects.jsonl` records the hash. Download, `sha256sum`, and only
  on a match copy to `cache/pdfs/<sha256>.pdf` and set
  `document.fetched_from` to the mirror URL, `document.url` to the lab's;
- with no document at all, write a **stub** (document block with what is
  known, every fact `unknown`, `notes` saying why) and stop after step 8.

Never proceed from a text dump, a summary, or memory of the card.

## 3. Index the document

```bash
uv run syscards text cache/pdfs/<sha256>.pdf --page 1
```

Read the cover and the table of contents (usually pages 1 to 5). Then build a
page index of the sections that answer the schema: the framework or
preparedness chapter, external testing or red teaming, the alignment or
model-behaviour chapter, safeguards and mitigations, the training-data
paragraph, child safety, welfare if present. A keyword scan over all pages
(`pages_containing` per term, or `syscards find`) tells you where each topic
lives. Page numbers are **physical** PDF pages; the printed numbers often
differ by one or more.

Read those sections. Do not read the whole card; do say in `notes` which
sections you read and which you only indexed.

## 4. Write the YAML

Copy the closest existing card in `sources/` as the template. For each
field, in schema order:

- **`reported`**: `value` is a short answer; `cite.page` is the physical
  page; `cite.quote` is one or two sentences copied exactly, including the
  lab's own hedges. Put the hedge in `cite.note` or the fact's `note`, not
  in `value`. **The designation rule**: `value` records what the lab
  designates ("treating as High", "conservatively CB-1" are
  `threshold_reached`); `threshold_not_ruled_out` is only for a lab that
  explicitly declines to conclude.
- **`withheld`**: the card says it ran the evaluation and does not give the
  result; quote the sentence that says so.
- **`not_reported`**: the card is silent. Add a `note` when the card defers
  to another document.
- **`not_applicable`**: only when the question cannot apply; say why.
- **`unknown`**: you did not look. Acceptable for a stub; otherwise finish.
- `framework.tier.value` is the lab's own term. A term not in
  `normalization/tiers.yaml` gets a row there, in this change, with the rung
  you can defend from the quote; say so in the audit table.
- `third_party.assessments`: one entry per named external evaluator with
  its own cite; a benchmark co-creator is not an assessor.
- `document`: `kind`, `title` as printed, `url` at the lab, `landing_url`
  if the lab has one, `published` at the precision printed, `pages`,
  `sha256`, `fetched` today, `fetched_from` only for a mirror.
- `models`: every model the document covers; omit `modalities` rather than
  guess.
- `provenance`: `extracted_by: llm_assisted`, `extracted_on` today,
  `verification: none`, no `verified_by`.
- `notes`: what you read, what you indexed only, where the bytes came from,
  "awaiting a human audit".

Quote rules that bite: straight and curly quotes, en and em dashes, and
ligatures are normalized on both sides, so type what you see; a quote must
sit on one page; a line-end hyphen may be joined or kept. Never trim a word
inside a quote, never fix the lab's typo, never join sentences from two
places.

## 5. Check until clean

```bash
uv run syscards check
```

Zero errors is the bar. Each error is a quote not on its page (use
`syscards find` to see where it is, then cite that page or different words),
a page count mismatch, an unmapped tier, or a schema violation. Each warning
is the keyword net: for every `not_reported` it flags, open the page, and
either change the status (the card does report it) or dismiss it with a
`note` naming what the keyword actually was ("GPU here is an evaluation
sandbox"). A warning left without a note is unfinished.

## 6. Build and test

```bash
uv run syscards build
uv run pytest -q
```

`test_repo_data` proves the new card loads, passes `check` without PDFs, and
has its tier mapped.

## 7. The audit table

Produce, verbatim for the PR body and the review brief, a checklist the
human audits, one box per judgment fact, in this order: tier (value, rung,
quote, page); each domain (outcome, raw threshold, quote, page); every
`withheld` and `not_applicable` with its note; every `not_reported` carrying
a note; every dismissed keyword-net warning with its note; then any other
`reported` value a reader could take differently from its quote. End with
one line: "N cites verified mechanically against `<sha256>.pdf`; not
re-audited here."

## 8. Commit

One commit, `data: add <lab> <model> (<yyyy-mm>)`, or `data: finish stub
<lab> <model>`; a second commit `data: map <term> in tiers.yaml` only if the
table changed. Add a row to `docs/quiz-topics.md` "Cards" in the same
commit. Local session: stop and show the audit table; wait. Remote session:
push the branch. Never open a PR unless asked; never set `verified_by` or
`verification`.

## Rules

- No fact without a page and a verbatim quote on that page
- No document, page number or quote from memory, a blog, or a summary
- Record the lab's designation; hedge in `note`
- Dismiss a warning only with a note that names what the keyword was
- `verification: none`, always
- Stay on the one card; a second document is a second run
