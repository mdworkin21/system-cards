# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical Workflow Rules (DO NOT OVERRIDE)

1. **STOP at checkpoints.** When working in phases/layers, STOP at the end of each phase. Do not commit. Do not push. Do not continue to the next layer. Wait for explicit user approval of the diff before proceeding.

2. **Never guess.** Every claim about the codebase or about a system card must be backed by a tool call (Read, grep, `syscards text`, `syscards find`). If you don't know, say "I don't know" and ask. No assumptions, no shortcuts. A fact about a card that you cannot cite to a page and a verbatim quote does not go into `sources/`.

3. **Provide vs. Execute.** When the user asks "what's the command for X" or "give me the command," respond with the text of the command. Do NOT run it unless explicitly asked to run it.

4. **Answer the question asked.** If the user asks a quick question, give a direct answer. Do not spiral into research, web scraping, or multi-step investigations unless explicitly asked to go deeper.

5. **No autonomous pushing.** Never push to GitHub until the user has reviewed the code AND explicitly said to push.

6. **No network in tests, no substitute environments.** Everything runs with `uv`; there is no Docker and nothing to stand up. If a lab's document host is unreachable, say so and record the card as a stub or use a hash-verified mirror (`docs/adding-a-card.md`); never fabricate a document, a page number, or a quote. If a PDF is not in `cache/pdfs/`, say the quotes are unverified rather than claiming `syscards check` proved them.

7. **Terse by default.** Answer questions in a few sentences — the direct answer first, only detail that changes a decision after. No preamble, no restating the question, no unrequested background, no headers/tables for simple questions, no "options I considered." Accuracy is never sacrificed for brevity: if a terse answer would be misleading, give the shortest accurate one and say "there's more to this — ask if you want the deep dive." Full detail only when the user explicitly asks (e.g. "deep dive", "go deeper"). This applies to follow-up answers too.

8. **Every test must be load-bearing.** Before writing or keeping a test, name the concrete bug it catches, confirm it would fail if that bug were introduced, and check no other test already catches it. Can't answer all three → don't write it. Never add a test *only* to raise coverage (a load-bearing test that also raises it is fine). Working checklist in `.claude/skills/writing-tests/SKILL.md`.

9. **Never upgrade a card's verification yourself.** `provenance.verification` stays `none` and `verified_by` stays empty until a named human has read every cite against the PDF and says so. The checker proves a quote is on a page; only a person decides the value is what the quote says.

10. **Never watch a PR unasked.** Do not subscribe to PR activity, poll CI, or babysit a PR after opening it, and do not offer to. Report the PR URL and stop. The only CI watch is the one inside an explicit `/autopilot` run.

### Web/remote sessions — scoped exception to #1 and #5

This subsection applies **only** when running in a remote execution environment
(Claude Code on the web, mobile, or a CI/automation trigger), where the user
cannot eyeball diffs in an editor and the pushed branch *is* the review surface.
It overrides rules #1 and #5 **in those sessions only**. In IDE/local sessions,
#1 and #5 apply exactly as written above — nothing here changes them. Rules #2,
#3, #4, #6, #9 and #10 are unaffected and apply in every session.

- **Commit and push when a unit of work is complete.** Work on the designated
  feature branch, commit with a clear message, and push — the pushed diff is how
  the user reviews. Do not sit on finished changes waiting for an approval the
  user can't conveniently give here.
- **Still off-limits without an explicit request:** opening pull requests,
  merging, and pushing to the default branch (`main`). Invoking a command
  that says it opens a PR (`/open-pr`, `/add-card`, `/autopilot`) is the
  request.

### Branch naming — do NOT work on the auto-generated `claude/*` branch

In remote/web sessions the harness pre-assigns a random working branch like
`claude/adjective-noun-id`. Those names are meaningless and unhelpful. Do NOT do
your work on that branch.

At the start of a task, create a descriptively-named branch off `origin/main`
(or the parent branch for stacked work) using a conventional-commit prefix plus
a short kebab-case slug derived from the task, and do all commits / pushes /
the PR from that branch:

- `feat/<slug>`, `fix/<slug>`, `chore/<slug>`, `docs/<slug>`, `refactor/<slug>`
- `data/<lab>-<model>` for adding or finishing a card (e.g. `data/anthropic-claude-opus-4.8`)

This is standing permission to push to a self-named branch instead of the assigned
`claude/*` one (which should be left unused). Pushing directly to `main` remains
off-limits.

**Exception — fixing an existing PR (e.g. `/fix-review`):** do NOT create a new
branch. Check out that PR's existing head branch and commit/push your fixes
there. Creating a new `fix/<slug>` branch orphans the fix from the PR.

## Invariants

These are the constraints the design hangs on (`docs/plan.md` explains why).
Violating one is a redesign, not a change.

1. **`sources/<lab>/<slug>.yaml` is the only source of truth.** Everything else
   (`data.json`, the schema export, any SQLite or site state) is derived by
   `syscards build` and never edited by hand. Nothing writes to `sources/`
   except a person or a reviewed PR.
2. **Every `reported` or `withheld` fact cites a physical page and a verbatim
   quote**, and `syscards check` proves the quote is on that page. Never
   paraphrase, "clean up", or stitch a quote; if the words are not on one page,
   pick different words.
3. **Status is explicit.** `reported`, `withheld`, `not_reported`,
   `not_applicable` are findings about the card; `unknown` is a gap in our
   work. Record the lab's designation as the value and put the hedging in
   `note` (`docs/schema.md`).
4. **The one cross-lab judgment lives in `normalization/tiers.yaml`.** No tier
   mapping anywhere in code or in the site.
5. **Tests run offline.** `pytest` disables sockets; tests build their own
   PDFs with pymupdf and never read `cache/pdfs/`.
6. **`cache/` and `drafts/` are never committed.** The repo holds URLs, hashes
   and short quotes, not the documents.
7. **The site reads `data.json` and nothing else.** No backend, no fetches.
   `site/src/types.generated.ts` comes from `schema/system-card.schema.json`
   and is never hand-edited.

## Development Commands

```bash
uv sync --all-groups
uv run pytest                          # offline; no network, no PDFs needed
uv run ruff check . && uv run ruff format --check . && uv run mypy
uv run syscards schema --check         # exported JSON Schema matches the models
uv run syscards check                  # sources/: schema, ids, tiers, quotes (if PDFs cached), keyword net
uv run syscards fetch-all              # cache every card's PDF by sha256
uv run syscards check --require-pdfs   # fail if any quote is unverified
uv run syscards build                  # -> site/public/data.json
uv run syscards text <pdf> --page N    # read a page, for extraction
uv run syscards find <pdf> "a phrase"  # which pages contain it
```

Site (`docs/site.md`; run `uv run syscards build` first so `site/public/data.json` exists):

```bash
cd site && npm ci && npm run dev        # http://localhost:5173/system-cards/
cd site && npm run gen-types            # after `syscards schema`; never hand-edit the output
cd site && npm run lint && npm run typecheck && npm run test && npm run build
```

## Architecture Overview

A reference dataset of what frontier-model system cards say about safety,
cited to the page, and a static page that renders it. Python data layer in
`src/system_cards/` (pydantic schema, PDF text and quote check, checker,
deterministic build, content-addressed fetch, `syscards` CLI); hand-reviewed
YAML in `sources/`; the tier ladder in `normalization/`; React + TypeScript
site in `site/` (planned) reading `data.json`. Hosted on GitHub Pages. For
file placement, see `docs/where-things-go.md`.

## Internal Documentation
- Plan and design rationale (read first): `docs/plan.md`
- Where things go: `docs/where-things-go.md`
- Reusable pieces a plan must check: `docs/building-blocks.md`
- Schema and what the checker enforces: `docs/schema.md`
- Normalization ladder: `docs/normalization.md`
- Adding a card: `docs/adding-a-card.md`
- Development workflow (autopilot, review brief, quiz): `docs/development-workflow.md`
- Decisions (ADRs): `docs/adr/README.md`

## Playwright MCP (Browser Testing)

When using Playwright MCP to test the site (Phase 2 onward):

- **Screenshots folder**: `.claude/ui-testing/screenshots/{feature-name}/`
- **Naming convention**: `{page}-{feature-or-state}.png` (e.g. `matrix-initial.png`, `matrix-filter-anthropic.png`)
- **No login.** The site is static and public.
- **App URL**: `http://localhost:5173/system-cards/` via `cd site && npm run dev`
- **Prefer snapshots over screenshots** for asserting page state — `browser_snapshot` for content, `browser_take_screenshot` for visual confirmation
