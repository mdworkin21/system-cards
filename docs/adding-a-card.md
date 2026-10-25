# Adding a card

Nobody reads a 200-page card end to end. The work is: get the document,
find the sections that answer the schema's questions, record each answer
with a page and a verbatim quote, and let the checker prove the quotes.

## 1. Get the document

```sh
uv run syscards fetch https://lab.example/system-card.pdf
```

This stores the bytes at `cache/pdfs/<sha256>.pdf` (gitignored), never
overwrites, and prints the sha256 and page count. Put both in the card's
`document` block, with `fetched` set to today.

If the lab's host is unreachable from where you are, a content-addressed
mirror of the lab's own bytes is acceptable **only if the hash matches
what the lab serves**. Record the mirror in `document.fetched_from` and
leave `document.url` as the lab's URL. The Frontier Model Observatory
(github.com/jlumbroso/frontier-model-observatory) keeps originals under
`artifacts/sha256/` as Git LFS objects, served from
`media.githubusercontent.com/media/<owner>/<repo>/main/<path>`.

## 2. Find the sections

```sh
uv run syscards text cache/pdfs/<sha256>.pdf --page 2    # one page
uv run syscards text cache/pdfs/<sha256>.pdf | less      # all of it
uv run syscards find cache/pdfs/<sha256>.pdf "a phrase"  # which pages say this
```

Page numbers are **physical** pages of the PDF, which usually differ from
the numbers printed on the pages. `find` tells you the physical page.

Start from the table of contents. The sections that answer most of the
schema are: the framework or preparedness chapter, the external testing
or red-teaming section, the alignment or model-behaviour chapter, the
safeguards or mitigations section, and the training data paragraph. A
card's executive summary usually yields a quote for half the facts.

## 3. Write the YAML

Copy an existing card from `sources/` as a template. For each Fact:

- `reported`: give `value`, `cite.page`, `cite.quote`. The quote must be
  verbatim and on that page. Keep it to one or two sentences.
- `withheld`: the card says it ran the evaluation but does not give the
  result. Cite the sentence that says so.
- `not_reported`: the card is silent. Add a `note` if the card defers to
  another document.
- `not_applicable`: say why in `note`.
- Leave `unknown` for anything you have not looked at.

`framework.tier.value` is the lab's own term. If it is new, add it to
`normalization/tiers.yaml` in the same change.

## 4. Check

```sh
uv run syscards check
```

Errors are quotes not on their page, page-count mismatches, unmapped tier
terms, and schema violations. Warnings are the keyword net: a
`not_reported` Fact whose keywords appear in the document. Look at each
one; most are real misses.

## 5. Provenance

Set `provenance.extracted_by` honestly (`human` or `llm_assisted`), and
leave `verification: none` until a person has read every cite against
the PDF. `full` is rejected while any Fact is `unknown`.

## Where to find cards

The labs' own index pages are primary: anthropic.com/transparency, the
OpenAI safety pages, and Google DeepMind's model-card listing. The Model
Card Explorer dataset (github.com/owizdom/ai-research-model-cards,
`data/dataset/documents.csv`, CC-BY 4.0) lists 90 documents across six
labs with URLs and is a good seed list to verify against.
