# system-cards

What frontier model system cards actually say about safety, compared side
by side and cited to the page.

**Status: Phase 1 built.** The data layer works end to end: a schema, a
checker that proves every quote is on its cited page, a deterministic
build, and three extracted cards (Gemini 3.1 Pro, GPT-5.2, Claude Fable
5.1 & Mythos 5.1) plus one stub. No site yet; that is Phase 2. The plan
is in [docs/plan.md](docs/plan.md). To add a card, read
[docs/adding-a-card.md](docs/adding-a-card.md).

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

Hand-reviewed YAML, one file per card, validated against a pydantic
schema and compiled to a single JSON file that a React and TypeScript
page reads. The page's types are generated from the same schema. No
server. A language model drafts each card's facts with cites; a script
rejects any quote that is not literally on the cited page; a human audits
the rest from a one-page review screen. Hosted on GitHub Pages.

## Quick start

```sh
uv sync --all-groups
uv run pytest                      # offline; no network, no PDFs needed
uv run syscards check              # validates sources/; verifies quotes if PDFs are cached
uv run syscards fetch-all          # caches each card's PDF by sha256 (gitignored)
uv run syscards check --require-pdfs
uv run syscards build              # writes site/public/data.json
```

## Layout

```
sources/<lab>/<model>.yaml   the only source of truth, hand-reviewed
schema/                      JSON Schema exported from the pydantic models
normalization/tiers.yaml     raw lab tier terms -> shared three-rung ladder
src/system_cards/            the data layer; installed as the `syscards` CLI
cache/pdfs/<sha256>.pdf      cached documents, gitignored
site/                        React + TypeScript page (Phase 2); reads data.json
docs/                        plan, schema, normalization, adding a card
```

## Working in this repo

`CLAUDE.md` holds the workflow rules (branches, checkpoints, what never
happens without a request) and the invariants. `docs/development-workflow.md`
describes the plan, autopilot, review-brief and quiz flow;
`docs/where-things-go.md` says where new code, data and docs belong.

## License

Code is MIT, see [LICENSE](LICENSE). Data is CC BY 4.0, see
[LICENSE-DATA.md](LICENSE-DATA.md), which also explains that quoted
excerpts from system cards remain their publishers' copyright and are
reproduced only as citations.
