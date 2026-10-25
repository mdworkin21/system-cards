# system-cards

What frontier model system cards actually say about safety, compared side
by side and cited to the page.

**Status: plan only.** Nothing is built yet. The plan is in
[docs/plan.md](docs/plan.md) and is the thing to read.

## The idea in one paragraph

Labs publish system cards for frontier models. The cards are long,
structured differently from one another, and nobody has put what they say
into one comparable table. This project is a static reference page where
each row is a card and each column is a question: which safety framework
and tier, what each dangerous-capability domain was assessed at, who
tested the model externally, which alignment and agentic-safety
evaluations ran, and what the card says it withheld. Every filled cell
carries a page number and a verbatim quote from the primary document.
Cells the card does not answer are shown, not hidden.

## What it is not

Not a ranking, not a grade, not a benchmark leaderboard. Those exist
elsewhere and the plan links to them. This is a reference.

## How it will be built

Hand-reviewed YAML, one file per card, validated against a schema and
compiled to a single JSON file that a static page reads. No server. A
language model drafts each card's facts with cites; a script rejects any
quote that is not literally on the cited page; a human audits the rest
from a one-page review screen. Hosted on GitHub Pages.

## Layout (planned)

```
sources/<lab>/<model>.yaml   the only source of truth, hand-reviewed
schema/                      pydantic models; JSON Schema export
normalization/               raw lab terms -> shared tier ladder, versioned
scripts/                     fetch, draft, check, review, build
site/                        static page; reads data.json
docs/                        plan, schema, normalization, adding a card
```
