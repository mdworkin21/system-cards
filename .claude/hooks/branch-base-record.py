#!/usr/bin/env python3
"""branch-base-record.py — PostToolUse hook (matcher: Bash)

After a branch is created, records its base branch in git config as
``branch.<new>.basebranch`` so the staleness notice (and humans) know which
branch a stack member sits on. The default base (master/main) is intentionally
NOT recorded — its absence means "master".

Base resolution mirrors the guard:
  • explicit start-point in the command → that ref
  • no start-point                      → the previous branch (`@{-1}`)

Contract: exit 0 always; this is best-effort bookkeeping and must never fail a
tool call.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _branchlib import parse_branch_creations  # noqa: E402

_DEFAULT_BASES = {"master", "main"}


def _git(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(["git", *args], capture_output=True, text=True)


def _branch_exists(name: str) -> bool:
    return (
        _git("show-ref", "--verify", "--quiet", f"refs/heads/{name}").returncode == 0
        or _git("show-ref", "--verify", "--quiet", f"refs/remotes/origin/{name}").returncode == 0
    )


def main() -> None:
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    if data.get("tool_name") != "Bash":
        sys.exit(0)
    command = (data.get("tool_input") or {}).get("command", "")
    creations = parse_branch_creations(command)
    if not creations:
        sys.exit(0)

    cur = _git("rev-parse", "--abbrev-ref", "HEAD").stdout.strip()
    prev = _git("rev-parse", "--abbrev-ref", "@{-1}").stdout.strip()

    # HEAD/@{-1} only describe the FINAL state, so the no-start-point base can be
    # resolved reliably for a single creation per command. With several creations
    # in one call (e.g. `git switch -c a && git switch -c b`) only the last one's
    # base is recoverable, so we record no-start-point bases only when there's
    # exactly one creation. Explicit start-points are unambiguous either way.
    single = len(creations) == 1

    for new, start in creations:
        if _git("show-ref", "--verify", "--quiet", f"refs/heads/{new}").returncode != 0:
            continue  # creation didn't actually happen
        if start:
            base = start
        elif not single:
            continue  # ambiguous base among multiple creations — skip (fail-open)
        elif cur == new:
            base = prev  # HEAD moved → created via checkout -b / switch -c
        else:
            base = cur  # HEAD unchanged → created via plain `git branch`
        if not base:
            continue
        if base.startswith("origin/"):
            base = base[len("origin/") :]
        if base in _DEFAULT_BASES or base == new:
            continue  # default base is implied by absence
        if not _branch_exists(base):
            continue
        _git("config", f"branch.{new}.basebranch", base)

    sys.exit(0)


if __name__ == "__main__":
    main()
