# Quiz Topics

The catalog `/quiz` draws from. Each row is one thing you can be quizzed on,
a mechanism, a process, or a card, paired with the sources a quiz should
read before writing questions.

Use it three ways:

- `/quiz list` — print this catalog and pick from it
- `/quiz random` — a topic is chosen at random from the rows below
- `/quiz <topic name>` — quiz on one topic by name (the **bolded** name in a row)

## Format contract — do not break

`/quiz random` selects a topic by regex-matching the **bolded first cell** of
every table row in this file:

```
^\| \*\*(.+?)\*\*
```

So every quizzable row must start `| **Topic name** | …` and every bolded
first cell must be a real topic. Adding a table whose first column is not a
topic name will poison the random pick. Prose, headings, and this section are
ignored because they are not table rows.

## Maintenance rule

**A new feature surface adds a row here; a new card adds a row here.** When a
feature ships and gets its as-built doc, or a card lands in `sources/`, add it
to the right table with its sources. A quiz on a card checks that what the
card says got into your head, which is the whole point of the project.

## Data layer

| Topic | What it covers | Sources |
|---|---|---|
| **Fact statuses** | What `reported`, `withheld`, `not_reported`, `not_applicable` and `unknown` each mean, which require a cite, which may carry a value, and how each renders. The designation rule: record the lab's designation, hedge in `note`. | `docs/schema.md`; `src/system_cards/schema.py` (`Status`, `Fact`, `_check_cite_rules`) |
| **Quote verification** | What normalization is applied to both sides, how line-end hyphens are handled, what the found-elsewhere hint means, and what the check cannot catch (a quote on the page that does not support the value). | `docs/schema.md` "What syscards check enforces"; `src/system_cards/pdftext.py`; `src/system_cards/check.py:check_card` |
| **Keyword net** | Why `not_reported` is the risky status, how matching is word-based with case-sensitive acronyms, and what to do with a warning (fix the status, or dismiss it with a note). | `src/system_cards/schema.py` (`KEYWORDS`, `keyword_pattern`); `src/system_cards/check.py` |
| **Normalization ladder** | The three rungs, the `(framework, raw)` key, why the raw term is always shown, when `version` bumps, and why domain outcomes are not table-normalized. | `docs/normalization.md`; `normalization/tiers.yaml`; `src/system_cards/normalization.py` |
| **Document identity and the cache** | sha256-named cache, never overwriting, `DocumentChanged` on a revised URL, `fetched_from` for mirrors, why PDFs are never committed. | `src/system_cards/fetch.py`; `docs/adding-a-card.md` |
| **Build output** | The shape of `data.json`: `normalized_tier`, `withheld`, `not_reported`, `coverage`, `fact_paths`, `rungs`, `domain_outcomes`; why it is typed (`Dataset` is the export root), why it is deterministic and why the site reads nothing else. | `src/system_cards/build.py`; `docs/schema.md`; `docs/adr/0001-typed-dataset-contract.md`; `docs/plan.md` section 6 |

## Site

| Topic | What it covers | Sources |
|---|---|---|
| **Site matrix and detail** | How `data.json` reaches the page (one loader, hash routing on Pages), why sort and filters are URL params, how a status stays readable without color, what a cell's popover shows and how `#page=N` is built, why the stub row is dimmed, what CI checks for the site (type drift, the lab-name grep). | `docs/site.md`; `docs/adr/0002-url-owns-view-state.md`; `site/src/lib/`; `site/src/components/Matrix.tsx` |

## Cards

| Topic | What it covers | Sources |
|---|---|---|
| **Card: Claude Fable 5.1 & Mythos 5.1** | CB-1 designated and CB-2 not crossed; FCF cyber Tier 1 with additional mitigations; autonomy threat models 1 and 2; METR, Gray Swan, Trajectory Labs, 10a Labs; alignment findings (covert capabilities, honesty under pressure, grader awareness); the sandbox-read incident. | `sources/anthropic/claude-fable-5.1-mythos-5.1.yaml`; the cached PDF pages it cites |
| **Card: GPT-5.2 update** | High in Biological and Chemical as a precaution; cyber and AI self-improvement below High; Apollo Research on scheming; Irregular on cyber; production deception 1.6%; what the addendum defers to the GPT-5 card. | `sources/openai/gpt-5.2.yaml`; the cached PDF pages it cites |
| **Card: Gemini 3.1 Pro** | The five FSF domains and their results, cyber at the alert threshold, what the nine-page card defers to the Gemini 3 Pro card and FSF report, and why third-party testing is `not_reported`. | `sources/google-deepmind/gemini-3.1-pro.yaml`; the cached PDF pages it cites |

## Process

| Topic | What it covers | Sources |
|---|---|---|
| **Adding a card** | Fetch and hash, index the document, write facts with verbatim quotes, run `check`, dismiss or fix every warning, leave `verification: none`, branch naming, what a human does before the record counts as audited. | `docs/adding-a-card.md`; `CLAUDE.md` rules 2, 6, 9; `.claude/commands/add-card.md` |
| **Development workflow** | Flow A and Flow B, the review brief's decision boxes, the card-PR brief, what autopilot never does (merge, deploy, push `main`, upgrade verification), branch names. | `docs/development-workflow.md`; `CLAUDE.md`; `.claude/commands/autopilot.md` |
