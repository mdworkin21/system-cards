---
description: Active-recall quiz on a PR, a mechanism, or a card - scenario questions that check it actually made it into your head
model: fable
allowedArgs: freeform
---

You are in QUIZ MODE. Do not write or change any code or card.

Purpose: review-as-reading produces an illusion of comprehension. This command
checks whether the knowledge transfer actually happened, using active recall.
For a card, the question is whether what the card says got into your head,
which is the whole point of the dataset. See `docs/development-workflow.md`.

## Getting started

Interpret the argument:

- **PR number** (e.g. `#12`): quiz on that PR. Sources: the PR body (including
  its Review Guide or audit table), the diff (`gh pr diff <PR#>` or the MCP
  equivalent), the linked plan issue, and the feature's doc under `docs/`.
  For a card PR, also open the cited pages (`uv run syscards text`).

- **`random`**: quiz on a randomly chosen topic. Run exactly this command:
  ```bash
  python3 -c "import random,re,pathlib; t=re.findall(r'^\| \*\*(.+?)\*\*', pathlib.Path('docs/quiz-topics.md').read_text(), re.M); print(random.choice(t))"
  ```
  Use the topic name it prints **as-is**. Do not choose a topic yourself, do not
  substitute a different one, do not run the command twice. Tell the user which
  topic came up, then run topic mode on it. If the command fails or prints
  nothing, say so and ask the user to pick from `list`.

- **`list`**: read `docs/quiz-topics.md` and print the topic names grouped by
  their category headings. Then ask which one to quiz on.

- **Topic or card name** (e.g. `Quote verification`, `Card: GPT-5.2 update`):
  look it up in `docs/quiz-topics.md` first:
  - **Found** (exact or obvious near-match): use that row's listed sources. If
    the match was approximate, say which topic you matched to.
  - **Not found**: say it isn't in the catalog, then quiz anyway from the doc or
    card and the files it cites. At the end, suggest adding a row.

If no argument, ask whether they want a PR (give the number), a specific topic,
`random`, or `list`.

Read the sources before writing any questions. Every question must be
answerable from code, docs or pages you actually read this session, and you
must know the answer and its `file:line` or page evidence before asking.

## Question design

Ask **3-5 questions**, one at a time. Wait for the answer before revealing
anything or asking the next.

Questions are **scenario-based**, never trivia:
- Failure tracing: "`syscards check` says a quote was found on page 9 instead
  of 8 — what are the two likely causes and which do you fix?"
- Edge behavior: "A lab revises the PDF at the same URL. What happens on the
  next `fetch-all`, and what does the record need?"
- Design rationale: "Why is the normalized rung computed at build time and not
  stored on the card?"
- Change impact: "If we add a `goal_guarding` fact, which files change and
  which existing cards need an edit?"
- Card recall: "What did the GPT-5.2 card designate for Biological and
  Chemical, and what hedge did the lab attach? What did it call the cyber
  threshold it did not meet?"
- Invariants: "What guarantees nothing writes to `sources/` without a person?"

Weight questions toward the judgment calls: status choices, the designation
rule, tier rows, check rules, and for a card its tier, domains, and anything
`withheld` or dismissed.

## Evaluating answers

- Judge the mental model, not the wording.
- Be honest — no grade inflation. A partially right answer gets told exactly
  which part was off.
- **Every miss routes to specific rereading**: name the doc section,
  `file:line`, or page to revisit, and give a one-sentence version of the
  right answer.

## Wrapping up

After the last question, give a short summary: what's solid, what to reread
(specific sections, files or pages), and optionally one thing worth checking
by hand in the PDF or the built `data.json`.

Keep the whole session under ~10 minutes.
