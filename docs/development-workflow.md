# Development Workflow

Carried over from the rgi_curate workflow on 2026-10-27 and adapted to a
repo that is half code and half dataset. Flow A (autopilot) is the default;
Flow B (interactive phased) is the fallback. The commands live in
`.claude/commands/`; the rules they all obey are in `CLAUDE.md`.

## Why this document exists

A very small team works with Claude as the implementer and the extractor.
That inverts the purpose of review: lint, types, tests and the mechanical
quote check are automated, so the part only a human can do is **knowledge
transfer**. Review is how the code and the cards get into the developer's
head. If the developer does not understand a card's judgment calls, nobody
does.

Two consequences:

1. **Review bandwidth is the bottleneck.** Claude extracts and implements
   faster than a person can audit. The flow is paced by review throughput,
   and the goal is minutes to durable understanding, not diff size.
2. **Attention is not uniformly needed.** In a code PR a few files carry
   decisions; in a card PR a few facts do (the tier, the domain outcomes,
   anything `withheld` or `not_applicable`, any dismissed warning). The rest
   is mechanics the checker already proved.

## Flow A — Autopilot

```
plan session ──> GitHub issue ──> /autopilot ──> review brief ──> human review
  (/plan-a)        (plan = ticket)               (READY FOR         │
                                                  HUMAN REVIEW)     ▼
 Pages deploy <── merge (human) <── /fix-review <── PR comments ────┘
```

0. **Optional `/whiteboard <feature>`.** The developer works the design in
   eight ordered steps, writing first; the command asks, probes and
   dissents by consequence, never proposes. Output feeds `/plan-a`.
1. **`/plan-a`.** Classifies the work (new feature surface or increment),
   produces a spec approved first, then a design with a reuse inventory
   against `docs/building-blocks.md`, a size estimate, and an
   implementation plan with a load-bearing tests table. `/review-plan` runs
   as a subagent on the design and again on the plan before the developer
   sees them. A new surface's design doc is committed at `docs/<slug>.md`.
2. **`/autopilot #<issue>`.** Implement (or, for a card, `/add-card`),
   simplify, open the PR, watch CI, independent subagent review, fix
   verified findings, re-check CI. Ends at **READY FOR HUMAN REVIEW**.
   Never merges, never pushes `main`, never deploys, never upgrades a
   card's verification.
3. **Human review from the brief**, not the raw diff. For a code PR the
   brief is decision boxes per close-read file; for a card PR it is the
   facts-to-audit table with each quote inline. Format:
   `.claude/reference/autopilot-review-brief.md`.
4. **Comments → `/fix-review <PR#>`** in a fresh session.
5. **Optional `/quiz <PR#|topic|random|list>`.** Active recall, 3 to 5
   scenario questions. Quizzing on a card ("what did the card say about
   cyber, and what did the lab call the threshold?") is the direct test of
   whether the dataset's purpose was served.
6. **Merge is manual and human.** Merging to `main` publishes the site via
   GitHub Pages (Phase 2); there is no other deploy.

### The review brief

Sized to the PR: under the cap (15 files, 400 app-code lines, one
capability) a short form of about 300 words, otherwise a full form
partitioned by capability. A card PR gets the card form. All forms link the
feature doc instead of restating it and end with **READY FOR HUMAN REVIEW**.

- **Code PR**: behaviors to verify (a run recipe for data-layer changes, a
  numbered list for the site), close-read files as decision boxes at the
  line where a decision lands, a sampled hygiene read of one skim-tier file,
  estimate vs actual, loose ends. Drift rows become decision boxes.
- **Card PR**: the header names the document, its sha256, the page count
  and how many cites `syscards check` verified. Then **facts to audit**, one
  checkbox per judgment fact with the value and the quote inline and the
  page to open, in this order: tier, each domain, every `withheld` and
  `not_applicable`, every `not_reported` with a note, every dismissed
  keyword-net warning, then any `reported` value the reviewer could read
  differently from its quote. Then loose ends. The reviewer opens the PDF
  only for boxes they doubt. When they are done they say so, and a
  follow-up commit sets `verified_by` and `verification`; autopilot never
  sets them.

### WIP limit

Autopilot lists open PRs at startup and warns before starting new work when
earlier ones await human review. Unreviewed PRs compound. Prefer finishing
reviews over starting features.

### Large features

Split by plan phase (`docs/plan.md` already does), never by file count.

## Flow B — Interactive phased flow

1. `/plan-a`, confirm before code.
2. `/implement`: layer by layer, checkpoints every 2 to 5 files, the
   developer reviews at each.
3. `/open-pr`: checks, then the PR with confirmation steps.
4. `/review <PR#>`: fresh-session multi-pass review, posted as `## Round N`.
5. `/fix-review <PR#> [round-N]`: fresh-session fixes on the PR head branch.

Use Flow B when the work is small enough that checkpoints are cheap, when
the change is exploratory, or when autopilot is being reverted.

## Card workflow

`/add-card <url | lab/model | stub path>` is the implement step for data.
It fetches and hashes the document (or verifies a hash-matched mirror when
the lab's host is unreachable), indexes it, writes the YAML with verbatim
quotes, runs `syscards check` until there are no errors, dismisses or fixes
every warning with a note, builds, and commits on `data/<lab>-<model>`. It
leaves `provenance.verification: none`. The human audit is the review; the
verification fields change only after it. `docs/adding-a-card.md` is the
procedure the command follows.

## Command inventory

| Command | Role | Model | Adapted from rgi_curate |
|---|---|---|---|
| `autopilot.md` | the orchestrator; adds the `card` entry point and the card brief | fable | yes: no deploy phase; card path; this repo's checks |
| `plan-a.md` | spec, design, estimate, plan, issue | fable | yes: classification examples, inventory file, close-read list |
| `review-plan.md` | adversarial design review, twice per plan | fable | yes: provenance pass replaces security pass |
| `implement.md` | follow the plan exactly, checkpoints | opus | yes: this repo's rules and self-review |
| `add-card.md` | extract one card from one document | fable | new |
| `open-pr.md` | checks, then the PR | haiku | yes: this repo's checks, `data:` prefix, Cards section |
| `review.md` | seven-pass review with an evidence contract | fable | yes: provenance and data-integrity pass |
| `fix-review.md` | fix PR comments on the PR's head branch | sonnet | yes: repo and checks |
| `quiz.md` | active recall on a PR, a topic, or a card | fable | light |
| `whiteboard.md` | developer-led design before `/plan-a` | fable | light: probes for this domain |
| `debug.md` | root cause before any change | fable | light: quote-check guidance |
| `whereami.md` | branch status in 12 lines | haiku | `main` |
| `ui-testing.md` | Playwright pass over the site | haiku | yes: no login, `site/` |

Rules for comments, tests and docs live in `.claude/skills/`; the commands
point at them. Flow A behavior differences are override instructions inside
`autopilot.md` passed to the delegated commands at runtime, so the commands
stay identical for interactive use.
