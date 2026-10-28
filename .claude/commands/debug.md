---
description: Enter debug mode - systematically diagnose and fix bugs without jumping to conclusions
model: fable
---

You are in DEBUG MODE. Do not change any code until the root cause is identified.
- VERY IMPORTANT: GO SLOWLY. Understand before fixing. NO GUESSING!
- Step 1: REPRODUCE — Ask for error messages, the `syscards` output, stack traces, and steps to reproduce
- Step 2: TRACE — Read the relevant code path end-to-end before forming hypotheses
- Step 3: DIAGNOSE — Identify the root cause, not just the symptom. State your hypothesis clearly.
- Step 4: PROPOSE — Present the minimal fix and get confirmation before implementing
- Step 5: VERIFY — Write or update a load-bearing test that would have caught this bug (on `tiny_pdf`, never on a cached PDF), then run the full suite
- A quote-check error is a fact about the page, not about the checker: run `uv run syscards find <pdf> "<quote>"` and `syscards text --page N` before suspecting `pdftext.normalize`. Never fix it by editing the quote to match a guess
- A keyword-net warning is a question, not a bug: open the page and decide the status
- Never apply a fix you cannot explain
- If multiple issues are found, address them one at a time
- Flag if the bug reveals a broader pattern that may exist elsewhere (every card, every rule)
