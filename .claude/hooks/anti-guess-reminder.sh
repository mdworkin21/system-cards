#!/usr/bin/env bash
#
# anti-guess-reminder.sh — UserPromptSubmit hook
#
# Injects a terse "evidence discipline" reminder into context on every user
# turn, so the no-guessing instruction stays salient as the context window
# fills (which is exactly when guessing gets worse). This is the conversational
# analogue of the /review skill's Evidence contract: CLAUDE.md rule #2 is read
# once and decays; this re-asserts it fresh, near the end of context, each turn.
#
# What the text demands is PROVENANCE, not a fresh tool call: name the commit
# the evidence was measured against. That closes guessing (a guess cannot
# produce a SHA that matches HEAD) without the failure mode the earlier wording
# had -- "back it with a command you ran" read as "re-run it", so a question
# about work just finished triggered a full re-verify of an unchanged tree.
# Re-running is only warranted when the tree moved since the measurement.
#
# v1 is ALWAYS-ON (fires every prompt). The injected text persists in the
# transcript and accumulates ~linearly with turn count (Claude Code issue
# #40216), but the per-turn cost is tiny (~60 tokens) next to tool outputs.
#
# FUTURE OPTIMIZATION (not v1): the hook input JSON on stdin includes
# `transcript_path`, so we can gate injection on transcript size — stay silent
# while the window is fresh and only inject once context crosses the
# degradation threshold. Left out of v1 deliberately to avoid premature
# complexity; see the branch/commit notes for the rationale.
#
# Contract: must exit 0 with valid JSON on stdout to ADD context. Exit code 2
# would BLOCK the prompt, which we never want here.

set -euo pipefail

# Drain stdin (the hook input JSON) so the caller never blocks on the pipe.
# v1 ignores the payload; a future size-gated version would parse transcript_path.
cat >/dev/null 2>&1 || true

cat <<'JSON'
{
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "additionalContext": "Evidence discipline (CLAUDE.md rule #2): cite evidence for claims about this codebase -- a file:line read, or a command run and its result, plus the commit it was measured against. Unchanged tree, earlier evidence still counts; don't re-run to re-confirm. No commit to name = not verified; say so."
  }
}
JSON
