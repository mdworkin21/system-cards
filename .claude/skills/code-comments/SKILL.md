---
name: code-comments
description: Rules for code comments and docstrings. Use whenever writing, editing, or reviewing code in this repo (Python, TypeScript/TSX, YAML, shell) — before adding any comment, docstring, or JSDoc, and when touching code that already has comments.
---

# Code comments

Comments are read by humans under load and by LLMs paying per token. A comment
that doesn't change what the reader does next is a cost, not documentation.

## Default: no comment

Names, types, and structure say **what** the code does. If the code needs a
comment to be understood, first try a better name, a smaller function, or a
named constant. Comment only what code can't express.

## When a comment earns its place

- **Why**, when the reason isn't visible: a constraint, a trade-off, a rejected obvious alternative.
- **Ordering or invariants** that are easy to break by "cleaning up".
- **Outside quirks**: a PDF extractor's behavior, a library bug, a lab's document format the code works around.
- **Surprising behavior** a reader would otherwise "fix".
- **Units, formats, ranges** not in the type (`# 1-based physical page`, `# YYYY-MM or YYYY-MM-DD`).

## Hard limits

- Inline / line comment: **≤ 2 lines.** Block comment: **≤ 4 lines.**
- Over the limit → the content belongs in `docs/`, the commit message, or the
  PR. Leave a one-line pointer if the reader truly needs it (`# See docs/schema.md`).
- Docstring: **one-line summary.** Add args/returns/raises only when the
  signature doesn't make them clear. No restating parameter names and types.
- Public API, module, and class docstrings follow the same rule: one line unless
  the contract is genuinely non-obvious.

## Never

- **History or narrative**: "previously", "we changed", "now", "originally",
  "as discussed". That's git's job.
- **Plan/process references**: design-doc sections, drift rows, slice names, PR numbers, reviewer names.
- **Issue numbers** except as `TODO(#12): <action>`.
- **Restating the code**: `# loop over pages`, `// render the row`.
- **Padding**: "Note:", "Important:", "Basically", "This function…", "Here we…".
- **Commented-out code.** Delete it.
- **Numbered step comments** narrating a function top to bottom. If the steps need labels, extract functions.

## YAML cards

A comment in a card (`sources/`) is for the reader of the file, not the
build: at most a header of two to four lines saying what the document is and
anything a reader needs before the first field (page-number offset, mirror
used). Everything about a fact goes in its `note`, never a comment, because
notes reach `data.json` and comments do not.

## Editing existing code

- A comment you make stale, you fix or delete in the same change.
- Don't add comments to code you didn't otherwise change.
- Don't mass-rewrite existing comments outside the diff.

## Example

Before (6 lines):

```python
# We need to handle hyphenation here. PDFs often break words across lines
# with a hyphen, like "infor-\nmation". We can't know whether the hyphen
# was part of the word or added by the line break, so we try both. This
# was added after the Gemini card failed to match. See the PR for details.
```

After (2 lines, same information a maintainer needs):

```python
# A line-end hyphen may be the word's own or the typesetter's; the PDF
# does not say, so a quote is matched against both readings.
```

## Self-check before finishing

For each comment you added or kept in the diff: if you deleted it, would the
next reader make a mistake? No → delete it. Yes → is it within the limits and
free of history? Fix it until it is.
